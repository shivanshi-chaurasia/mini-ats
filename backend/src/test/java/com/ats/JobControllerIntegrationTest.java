package com.ats;

import com.ats.dto.JobRequest;
import com.ats.entity.JobStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class JobControllerIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createJobAndFetchIt() throws Exception {
        JobRequest req = new JobRequest();
        req.setTitle("Backend Engineer");
        req.setDepartment("Engineering");
        req.setLocation("Bangalore");
        req.setStatus(JobStatus.OPEN);

        String body = mvc.perform(post("/api/v1/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Backend Engineer"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(body).get("id").asLong();

        mvc.perform(get("/api/v1/jobs/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.department").value("Engineering"));
    }

    @Test
    void createJobWithMissingFieldsReturnsBadRequest() throws Exception {
        mvc.perform(post("/api/v1/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").isNotEmpty());
    }

    @Test
    void getNonexistentJobReturns404() throws Exception {
        mvc.perform(get("/api/v1/jobs/999999"))
                .andExpect(status().isNotFound());
    }
}
