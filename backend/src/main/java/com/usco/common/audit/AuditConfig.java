package com.usco.common.audit;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement(order = AuditConfig.TX_ORDER)
public class AuditConfig {
    static final int TX_ORDER = Ordered.HIGHEST_PRECEDENCE;
}
