package com.ats;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class AtsApplication {

    // timestamps are stored and served as UTC so the API behaves the same on any host
    @PostConstruct
    void useUtc() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    public static void main(String[] args) {
        SpringApplication.run(AtsApplication.class, args);
    }
}
