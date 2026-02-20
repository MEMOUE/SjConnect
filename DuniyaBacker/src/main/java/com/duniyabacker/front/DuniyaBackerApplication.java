package com.duniyabacker.front;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class DuniyaBackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DuniyaBackerApplication.class, args);
    }

}
