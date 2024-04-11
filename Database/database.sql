CREATE DATABASE  IF NOT EXISTS `wwbdatabase` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `wwbdatabase`;
-- MySQL dump 10.13  Distrib 8.0.34, for macos13 (arm64)
--
-- Host: 127.0.0.1    Database: wwbdatabase
-- ------------------------------------------------------
-- Server version	8.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Gebruikers`
--

DROP TABLE IF EXISTS `Gebruikers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Gebruikers` (
  `Gebruiker_ID` int NOT NULL,
  `Voornaam` varchar(45) DEFAULT NULL,
  `Achternaam` varchar(45) DEFAULT NULL,
  `Geslacht` varchar(45) DEFAULT NULL,
  `Nationaliteit` varchar(45) DEFAULT NULL,
  `Email` varchar(45) DEFAULT NULL,
  `Telefoonnummer` varchar(45) DEFAULT NULL,
  `Postcode` varchar(45) DEFAULT NULL,
  `Huisnummer` int DEFAULT NULL,
  PRIMARY KEY (`Gebruiker_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Gebruikers`
--

LOCK TABLES `Gebruikers` WRITE;
/*!40000 ALTER TABLE `Gebruikers` DISABLE KEYS */;
INSERT INTO `Gebruikers` VALUES (1,'Hidde','Gerritsen','M','NL','1079142@hr.nl','0611427280','3332KS',13);
/*!40000 ALTER TABLE `Gebruikers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Passen`
--

DROP TABLE IF EXISTS `Passen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Passen` (
  `Pas_ID` int NOT NULL,
  `Pasnummer` varchar(45) DEFAULT NULL,
  `Rekening_ID` varchar(45) DEFAULT NULL,
  `Pincode` int DEFAULT NULL,
  `Foute_pogingen` int DEFAULT NULL,
  PRIMARY KEY (`Pas_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Passen`
--

LOCK TABLES `Passen` WRITE;
/*!40000 ALTER TABLE `Passen` DISABLE KEYS */;
INSERT INTO `Passen` VALUES (1,'UID15','1',1234,NULL),(2,'UID12','1',4321,NULL);
/*!40000 ALTER TABLE `Passen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Rekeningen`
--

DROP TABLE IF EXISTS `Rekeningen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Rekeningen` (
  `Rekening_ID` int NOT NULL,
  `Rekeningnummer` varchar(45) DEFAULT NULL,
  `Gebruikers_ID` varchar(45) DEFAULT NULL,
  `BalansCents` int DEFAULT NULL,
  `Maxdebt` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`Rekening_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Rekeningen`
--

LOCK TABLES `Rekeningen` WRITE;
/*!40000 ALTER TABLE `Rekeningen` DISABLE KEYS */;
INSERT INTO `Rekeningen` VALUES (1,'IM084875983745','1',100000000,'10000');
/*!40000 ALTER TABLE `Rekeningen` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-04-09 10:52:53
