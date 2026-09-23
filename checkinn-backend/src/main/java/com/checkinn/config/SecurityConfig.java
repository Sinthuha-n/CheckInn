package com.checkinn.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
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