package com.ats.service;

import com.ats.dto.DashboardDto;
import com.ats.entity.HiringStage;
import com.ats.repository.CandidateRepository;
import com.ats.repository.StageHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final List<HiringStage> FUNNEL = List.of(
            HiringStage.APPLIED, HiringStage.SCREENING, HiringStage.INTERVIEW,
            HiringStage.OFFER, HiringStage.HIRED);

    private final CandidateRepository candidateRepo;
    private final StageHistoryRepository historyRepo;

    @Transactional(readOnly = true)
    public DashboardDto buildMetrics() {
        long total = candidateRepo.count();

        Map<String, Long> countByStage = new LinkedHashMap<>();
        for (HiringStage stage : HiringStage.values()) {
            countByStage.put(stage.name(), 0L);
        }
        for (Object[] row : candidateRepo.countGroupedByStage()) {
            countByStage.put(((HiringStage) row[0]).name(), (Long) row[1]);
        }

        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        long hiresThisMonth = historyRepo.countHiresSince(monthStart);

        // share of all applicants who ever reached each stage, so skipped stages still count
        Map<String, Double> funnel = new LinkedHashMap<>();
        for (HiringStage stage : FUNNEL) {
            long reached = stage == HiringStage.APPLIED ? total : historyRepo.countCandidatesReaching(stage);
            funnel.put(stage.name(), total == 0 ? 0.0 : round1(reached * 100.0 / total));
        }

        Map<String, Long> topSources = new LinkedHashMap<>();
        for (Object[] row : candidateRepo.countGroupedBySource()) {
            topSources.put((String) row[0], (Long) row[1]);
        }

        Map<String, Long> byJob = new LinkedHashMap<>();
        for (Object[] row : candidateRepo.countGroupedByJob()) {
            byJob.put((String) row[0], (Long) row[1]);
        }

        return new DashboardDto(total, countByStage, hiresThisMonth, funnel,
                avgTimeToHireDays(), topSources, byJob, last30Days());
    }

    private double avgTimeToHireDays() {
        List<Object[]> hires = historyRepo.hireDates();
        if (hires.isEmpty()) {
            return 0.0;
        }
        double totalDays = 0;
        for (Object[] row : hires) {
            totalDays += Duration.between((LocalDateTime) row[0], (LocalDateTime) row[1]).toHours() / 24.0;
        }
        return round1(totalDays / hires.size());
    }

    private List<DashboardDto.DailyCount> last30Days() {
        LocalDate today = LocalDate.now();
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Object[] row : candidateRepo.countByDayAfter(today.minusDays(29).atStartOfDay())) {
            counts.put(row[0].toString(), (Long) row[1]);
        }
        List<DashboardDto.DailyCount> days = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            String day = today.minusDays(i).toString();
            days.add(new DashboardDto.DailyCount(day, counts.getOrDefault(day, 0L)));
        }
        return days;
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
