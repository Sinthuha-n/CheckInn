package com.checkinn;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"jwt.secret=integration-test-secret-key-1234567890"
})
class CheckinnBackendApplicationTests {

	@Test
	void contextLoads() {
	}
}