package com.ats;

import com.ats.entity.HiringStage;
import com.ats.exception.InvalidStageTransitionException;
import com.ats.service.StageTransitionValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StageTransitionValidatorTest {

    @ParameterizedTest(name = "{0} -> {1} is allowed")
    @CsvSource({
            "APPLIED, SCREENING",
            "APPLIED, INTERVIEW",
            "SCREENING, INTERVIEW",
            "INTERVIEW, SCREENING",
            "INTERVIEW, OFFER",
            "OFFER, HIRED",
            "APPLIED, REJECTED",
            "OFFER, REJECTED"
    })
    void allowedMoves(HiringStage from, HiringStage to) {
        assertThatCode(() -> StageTransitionValidator.validate(from, to)).doesNotThrowAnyException();
    }

    @ParameterizedTest(name = "{0} -> {1} is blocked")
    @CsvSource({
            "HIRED, APPLIED",
            "HIRED, SCREENING",
            "HIRED, REJECTED",
            "REJECTED, APPLIED",
            "REJECTED, SCREENING",
            "APPLIED, HIRED",
            "SCREENING, HIRED",
            "INTERVIEW, HIRED",
            "APPLIED, APPLIED"
    })
    void blockedMoves(HiringStage from, HiringStage to) {
        assertThatThrownBy(() -> StageTransitionValidator.validate(from, to))
                .isInstanceOf(InvalidStageTransitionException.class)
                .hasMessageContaining(from.name());
    }

    @Test
    void finalStagesHaveNoExit() {
        for (HiringStage target : HiringStage.values()) {
            assertThatThrownBy(() -> StageTransitionValidator.validate(HiringStage.HIRED, target))
                    .isInstanceOf(InvalidStageTransitionException.class);
            assertThatThrownBy(() -> StageTransitionValidator.validate(HiringStage.REJECTED, target))
                    .isInstanceOf(InvalidStageTransitionException.class);
        }
    }
}
