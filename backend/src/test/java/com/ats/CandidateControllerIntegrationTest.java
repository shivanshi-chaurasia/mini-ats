package com.ats;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class CandidateControllerIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    private long createCandidate(String email) throws Exception {
        String body = """
                {"name": "Test Person", "email": "%s", "skills": "Java, SQL", "experienceYears": 3, "source": "Referral"}
                """.formatted(email);
        String response = mvc.perform(post("/api/v1/candidates")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.currentStage").value("APPLIED"))
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.get("id").asLong();
    }

    private void moveTo(long id, String stage) throws Exception {
        mvc.perform(patch("/api/v1/candidates/" + id + "/stage")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetStage\": \"" + stage + "\"}"));
    }

    @Test
    void movingStageRecordsHistory() throws Exception {
        long id = createCandidate("history@example.com");

        mvc.perform(patch("/api/v1/candidates/" + id + "/stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetStage\": \"SCREENING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStage").value("SCREENING"));

        mvc.perform(get("/api/v1/candidates/" + id + "/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fromStage").value("APPLIED"))
                .andExpect(jsonPath("$[0].toStage").value("SCREENING"));
    }

    @Test
    void rejectedCandidateCannotMoveBack() throws Exception {
        long id = createCandidate("rejected@example.com");
        moveTo(id, "REJECTED");

        mvc.perform(patch("/api/v1/candidates/" + id + "/stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetStage\": \"APPLIED\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void duplicateEmailReturnsConflict() throws Exception {
        createCandidate("dupe@example.com");

        mvc.perform(post("/api/v1/candidates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Other\", \"email\": \"DUPE@example.com\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void searchFiltersByKeywordAndRejectsBadSortField() throws Exception {
        createCandidate("searchable@example.com");

        mvc.perform(get("/api/v1/candidates").param("keyword", "searchable").param("sortBy", "nonsense"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].email").value("searchable@example.com"));
    }
}
