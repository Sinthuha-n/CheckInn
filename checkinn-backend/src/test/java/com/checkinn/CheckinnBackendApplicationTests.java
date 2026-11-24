package com.checkinn;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:context_test_db;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.flyway.enabled=true",
		"spring.flyway.baseline-on-migrate=true",
		"spring.flyway.baseline-version=0",
		"spring.jpa.hibernate.ddl-auto=validate",
		"jwt.secret=integration-test-secret-key-1234567890",
		"checkinn.inventory.seed-enabled=false",
		"spring.mail.host=localhost",
		"spring.mail.port=2525"
})
class CheckinnBackendApplicationTests {

	@Test
	void contextLoads() {
	}
}
