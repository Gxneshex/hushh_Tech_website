import React from "react";
import { Container, Box, Heading, Text, Divider } from "@chakra-ui/react";
import RiskDisclosures from "../../content/posts/nda/riskDisclosure";

const RiskDisclosuresPage: React.FC = () => {
  return (
    <>
      <Box textAlign="center" mt={{ md: "5rem", base: "2rem" }} mb={10}>
        <Heading
          as="h1"
          size="2xl"
          fontWeight={"500"}
          className="blue-gradient-text"
          my={{ md: "5rem", base: "2rem" }}
        >
          Risk Disclosures
        </Heading>
      </Box>
      <Container maxW="container.lg" py={10} px={4}>
        <Box textAlign="center" mb={6}>
          <Text fontSize="sm" color="gray.600">
            Please read these disclosures before committing to invest.
          </Text>
        </Box>
        <Divider mb={8} />
        <RiskDisclosures />
      </Container>
    </>
  );
};

export default RiskDisclosuresPage;
