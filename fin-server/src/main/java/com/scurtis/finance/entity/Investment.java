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
@Table(schema = "finance", name = "investment")
public class Investment implements Persistable<Long> {

    @Id
    @Column(value = "investment_id")
    private Long id;
    private String ticker;
    private String category;
    private String color;
    private BigDecimal price;
    private Integer sequence;
    @ReadOnlyProperty
    @Column(value = "created_date")
    private LocalDate creationDate;

    @Override
    @Transient
    public boolean isNew() {
        return id == null || id == 0;
    }

}
