package com.ats.service;

import com.ats.entity.HiringStage;
import com.ats.exception.InvalidStageTransitionException;

import java.util.EnumSet;
import java.util.Set;

import static com.ats.entity.HiringStage.*;

/**
 * Active stages (APPLIED to OFFER) can move freely among themselves, so a recruiter
 * can skip a stage or step back. HIRED is only reachable from OFFER, and both HIRED
 * and REJECTED are final.
 */
public final class StageTransitionValidator {

    private static final Set<HiringStage> ACTIVE = EnumSet.of(APPLIED, SCREENING, INTERVIEW, OFFER);

    private StageTransitionValidator() {}

    public static void validate(HiringStage from, HiringStage to) {
        if (!isAllowed(from, to)) {
            throw new InvalidStageTransitionException(
                    "Cannot move candidate from " + from + " to " + to);
        }
    }

    private static boolean isAllowed(HiringStage from, HiringStage to) {
        if (from == to || !ACTIVE.contains(from)) {
            return false;
        }
        if (to == HIRED) {
            return from == OFFER;
        }
        return true;
    }
}
