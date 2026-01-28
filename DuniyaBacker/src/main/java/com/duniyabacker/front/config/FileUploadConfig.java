package com.duniyabacker.front.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Servir les fichiers uploadés standards
        String uploadPath = new File(uploadDir).getAbsolutePath();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");

        // Servir les fichiers de l'espace partagé
        String sharedPath = new File(uploadDir + "/shared").getAbsolutePath();
        registry.addResourceHandler("/uploads/shared/**")
                .addResourceLocations("file:" + sharedPath + "/");

        System.out.println("📁 Configured file serving:");
        System.out.println("   /uploads/** -> " + uploadPath);
        System.out.println("   /uploads/shared/** -> " + sharedPath);
    }
}