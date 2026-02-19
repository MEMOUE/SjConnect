package com.duniyabacker.front.entity.maketplace;

import com.duniyabacker.front.entity.chat.Message;
import jakarta.persistence.Column;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.*;

@EqualsAndHashCode(callSuper = true)
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarketPlace extends Message {

    @Column(name = "secteur_activite", nullable = false)
    private String secteurActivite;
}
