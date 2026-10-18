package com.ats.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDto {
    private long totalCandidates;
    private Map<String, Long> countByStage;
    private long hiresThisMonth;
    private Map<String, Double> funnelConversion;
    private double avgTimeToHireDays;
    private Map<String, Long> topSources;
    private Map<String, Long> applicationsByJob;
    private List<DailyCount> last30Days;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyCount {
        private String date;
        private long count;
    }
}
