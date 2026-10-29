package com.scurtis.finance.provider;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class AlphaVantageQuote {

    @JsonProperty("Global Quote")
    private GlobalQuote globalQuote;
    @JsonProperty("Information")
    private String information;
    @JsonProperty("Note")
    private String note;
    @JsonProperty("Error Message")
    private String errorMessage;

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GlobalQuote {

        @JsonProperty("05. price")
        private BigDecimal price;

    }

}
