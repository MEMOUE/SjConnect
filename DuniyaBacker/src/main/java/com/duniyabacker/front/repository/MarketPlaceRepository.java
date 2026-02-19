package com.duniyabacker.front.repository;

import com.duniyabacker.front.entity.maketplace.MarketPlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MarketPlaceRepository extends JpaRepository<MarketPlace, Long> {

}
