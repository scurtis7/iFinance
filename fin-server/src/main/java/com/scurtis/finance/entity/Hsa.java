package com.scurtis.finance.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@Table(schema = "finance", name = "hsa")
public class Hsa implements Persistable<Long> {

    @Id
    @Column(value = "hsa_id")
    private Long id;
    private BigDecimal balance;
    @ReadOnlyProperty
    @Column(value = "created_date")
    private LocalDate creationDate;

    @Override
    @Transient
    public boolean isNew() {
        return id == null || id == 0;
    }

}
