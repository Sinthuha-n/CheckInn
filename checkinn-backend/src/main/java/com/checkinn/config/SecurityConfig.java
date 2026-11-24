package com.checkinn.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final String frontendUrl;

    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            @Value("${frontend.url:http://localhost:5173}") String frontendUrl
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.frontendUrl = frontendUrl;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(frontendUrl.split(","))
                .map(String::trim)
                .map(url -> url.replaceAll("/+$", ""))
                .filter(url -> !url.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                // Authentication APIs
                .requestMatchers("/api/auth/**")
                .permitAll()

                // Room viewing - USER + ADMIN
                .requestMatchers(HttpMethod.GET, "/api/rooms/**")
                .hasAnyRole("USER", "ADMIN")

                // Room creation - ADMIN only
                .requestMatchers(HttpMethod.POST, "/api/rooms")
                .hasRole("ADMIN")

                // Room update - ADMIN only
                .requestMatchers(HttpMethod.PUT, "/api/rooms/**")
                .hasRole("ADMIN")

                // Room deletion - ADMIN only
                .requestMatchers(HttpMethod.DELETE, "/api/rooms/**")
                .hasRole("ADMIN")

                // Booking creation
                .requestMatchers(HttpMethod.POST, "/api/bookings")
                .hasAnyRole("USER", "ADMIN")

                // User's bookings
                .requestMatchers(HttpMethod.GET, "/api/bookings/my")
                .hasAnyRole("USER", "ADMIN")

                // Cancel booking
                .requestMatchers(HttpMethod.PUT, "/api/bookings/*/cancel")
                .hasAnyRole("USER", "ADMIN")

                // Admin - all bookings
                .requestMatchers(HttpMethod.GET, "/api/bookings")
                .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/reviews/room/**")
                        .permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/reviews")
                        .hasAnyRole("USER", "ADMIN")

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()
                        
                .anyRequest()
                .authenticated()
        )

                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );


        return http.build();
    }
}