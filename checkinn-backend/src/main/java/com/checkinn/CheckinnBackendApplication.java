
package com.checkinn;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class CheckinnBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(
				CheckinnBackendApplication.class,
				args
		);
	}
}