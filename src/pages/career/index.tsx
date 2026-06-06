import React from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Briefcase,
  ChevronRight,
  Clock,
  DollarSign,
  MapPin,
  Rocket,
  Sparkles,
} from "lucide-react";

import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import { careers } from "../../data/career";
import JobDetails from "./JobDetails";
import {
  appleDisplayFont,
  appleFont,
  brandBlue,
  focusVisible,
  glassCardChrome,
  glassCardInteractiveChrome,
  pageBg,
  sectionHeadingProps,
  textPrimary,
  textSecondary,
  textTertiary,
} from "./careerTheme";
import "./Career.css";

const benefitCards = [
  {
    icon: Rocket,
    title: "Cutting-edge technology",
    body: "Work with AI, quantitative research, and data systems built for real investing outcomes.",
    tint: "#0066CC",
    bg: "rgba(0, 102, 204, 0.1)",
  },
  {
    icon: DollarSign,
    title: "Meaningful upside",
    body: "Competitive compensation, ownership-minded incentives, and work tied directly to business impact.",
    tint: "#34C759",
    bg: "rgba(52, 199, 89, 0.11)",
  },
  {
    icon: Sparkles,
    title: "Fast growth",
    body: "Learn from operators, researchers, and builders while taking on real responsibility early.",
    tint: "#AF52DE",
    bg: "rgba(175, 82, 222, 0.1)",
  },
];

const totalRoles = Object.values(careers).reduce((count, jobs) => count + jobs.length, 0);
const totalDepartments = Object.keys(careers).length;

const metaTextProps = {
  fontSize: "13px",
  fontWeight: "400",
  color: textTertiary,
  lineHeight: "1.35",
};

function LiquidIcon({
  icon,
  tint = brandBlue,
  bg = "rgba(0, 102, 204, 0.1)",
  size = 42,
}: {
  icon: typeof Briefcase;
  tint?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <Flex
      align="center"
      justify="center"
      w={`${size}px`}
      h={`${size}px`}
      flexShrink={0}
      borderRadius="16px"
      color={tint}
      bg={bg}
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 24px rgba(29,29,31,0.08)"
    >
      <Icon as={icon} boxSize={`${Math.round(size * 0.45)}px`} strokeWidth={1.8} aria-hidden />
    </Flex>
  );
}

const CareerList = () => {
  return (
    <Box bg={pageBg} minH="100vh" style={{ fontFamily: appleFont }}>
      <HushhTechBackHeader rightType="hamburger" />
      <Box as="main" id="main-content" w="100%">
        <Container maxW="7xl" pt={{ base: 28, md: 32 }} pb={{ base: 12, md: 20 }} px={{ base: 5, md: 6, lg: 8 }}>
          <Box textAlign="center" mb={{ base: 10, md: 14 }}>
            <Text
              as="p"
              mb={4}
              fontSize="13px"
              fontWeight="600"
              letterSpacing="0.18em"
              textTransform="uppercase"
              color={brandBlue}
            >
              Careers
            </Text>
            <Heading
              as="h1"
              fontSize={{ base: "36px", sm: "44px", md: "56px" }}
              mb={5}
              letterSpacing="-0.028em"
              lineHeight="1.06"
              fontWeight="500"
              color={textPrimary}
              style={{ fontFamily: appleDisplayFont, textWrap: "balance" }}
            >
              Hushh Jobs.
            </Heading>
            <Text
              fontSize={{ base: "16px", sm: "17px", md: "20px" }}
              maxW="520px"
              mx="auto"
              color={textSecondary}
              fontWeight="300"
              lineHeight="1.45"
            >
              Help us build the AI-powered investment company where rigorous research, product craft,
              and long-term ownership meet.
            </Text>

            <HStack justify="center" spacing={{ base: 3, md: 5 }} mt={7} flexWrap="wrap">
              <Badge
                px={3}
                py={1.5}
                borderRadius="full"
                bg="rgba(0, 102, 204, 0.08)"
                color={brandBlue}
                fontSize="12px"
                fontWeight="600"
                letterSpacing="0.08em"
              >
                {totalRoles} open roles
              </Badge>
              <Badge
                px={3}
                py={1.5}
                borderRadius="full"
                bg="rgba(29, 29, 31, 0.05)"
                color="rgba(29, 29, 31, 0.62)"
                fontSize="12px"
                fontWeight="600"
                letterSpacing="0.08em"
              >
                {totalDepartments} teams
              </Badge>
            </HStack>
          </Box>

          <VStack spacing={{ base: 6, md: 8 }} align="stretch" maxW="1060px" mx="auto">
            {Object.entries(careers).map(([department, jobs]) => (
              <Box key={department} p={{ base: 5, md: 7 }} {...glassCardChrome}>
                <Flex
                  align={{ base: "flex-start", md: "center" }}
                  justify="space-between"
                  gap={4}
                  mb={{ base: 5, md: 6 }}
                  direction={{ base: "column", md: "row" }}
                >
                  <Box>
                    <Text
                      mb={2}
                      fontSize="12px"
                      fontWeight="600"
                      letterSpacing="0.16em"
                      textTransform="uppercase"
                      color={brandBlue}
                    >
                      Team
                    </Text>
                    <Heading as="h2" {...sectionHeadingProps} style={{ fontFamily: appleDisplayFont }}>
                      {department}
                    </Heading>
                  </Box>
                  <Text fontSize="14px" fontWeight="400" color={textTertiary}>
                    {jobs.length} {jobs.length === 1 ? "role" : "roles"}
                  </Text>
                </Flex>

                <VStack spacing={3.5} align="stretch">
                  {jobs.map((job) => (
                    <Box
                      key={job.id}
                      as={Link}
                      to={`/career/${job.id}`}
                      aria-label={`View ${job.title} role`}
                      p={{ base: 4, md: 5 }}
                      {...glassCardInteractiveChrome}
                      {...focusVisible}
                    >
                      <Flex align="center" justify="space-between" gap={4}>
                        <Flex align={{ base: "flex-start", md: "center" }} gap={4} minW={0}>
                          <LiquidIcon icon={Briefcase} />
                          <Box minW={0}>
                            <Heading
                              as="h3"
                              fontSize={{ base: "18px", md: "20px" }}
                              lineHeight="1.2"
                              letterSpacing="-0.018em"
                              fontWeight="600"
                              color={textPrimary}
                              style={{ fontFamily: appleDisplayFont }}
                            >
                              {job.title}
                            </Heading>
                            <HStack
                              mt={3}
                              spacing={{ base: 2, md: 5 }}
                              alignItems={{ base: "flex-start", md: "center" }}
                              flexDirection={{ base: "column", md: "row" }}
                            >
                              <HStack spacing={2}>
                                <Icon as={MapPin} boxSize={4} color={brandBlue} aria-hidden />
                                <Text {...metaTextProps}>{job.location}</Text>
                              </HStack>
                              <HStack spacing={2}>
                                <Icon as={Clock} boxSize={4} color={brandBlue} aria-hidden />
                                <Text {...metaTextProps}>Full-time</Text>
                              </HStack>
                            </HStack>
                          </Box>
                        </Flex>
                        <Icon as={ChevronRight} color="rgba(29, 29, 31, 0.34)" boxSize={5} aria-hidden />
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </Box>
            ))}
          </VStack>

          <Box mt={{ base: 14, md: 18 }} maxW="1060px" mx="auto">
            <Box textAlign="center" mb={{ base: 7, md: 9 }}>
              <Text
                mb={3}
                fontSize="12px"
                fontWeight="600"
                letterSpacing="0.16em"
                textTransform="uppercase"
                color={brandBlue}
              >
                Why Hushh
              </Text>
              <Heading as="h2" {...sectionHeadingProps} style={{ fontFamily: appleDisplayFont }}>
                Designed for ambitious builders.
              </Heading>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
              {benefitCards.map((benefit) => (
                <Box key={benefit.title} p={{ base: 5, md: 6 }} {...glassCardChrome}>
                  <LiquidIcon icon={benefit.icon} tint={benefit.tint} bg={benefit.bg} size={48} />
                  <Heading
                    as="h3"
                    mt={5}
                    mb={2.5}
                    fontSize="20px"
                    lineHeight="1.2"
                    letterSpacing="-0.018em"
                    fontWeight="600"
                    color={textPrimary}
                    style={{ fontFamily: appleDisplayFont }}
                  >
                    {benefit.title}
                  </Heading>
                  <Text fontSize="15px" lineHeight="1.55" fontWeight="300" color={textSecondary}>
                    {benefit.body}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          <Flex justify="center" mt={{ base: 10, md: 12 }}>
            <Button
              as={Link}
              to="/benefits"
              h="52px"
              px={7}
              borderRadius="full"
              bg={brandBlue}
              color="white"
              fontSize="16px"
              fontWeight="500"
              letterSpacing="-0.01em"
              boxShadow="0 14px 30px rgba(0, 102, 204, 0.22)"
              _hover={{ bg: "#0057B8", textDecoration: "none" }}
              _active={{ transform: "scale(0.98)" }}
              {...focusVisible}
            >
              View full benefits
            </Button>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

const Career = () => {
  const location = useLocation();

  if (location.pathname === "/career") {
    return <CareerList />;
  }

  return (
    <Routes>
      <Route path="/:jobId" element={<JobDetails />} />
    </Routes>
  );
};

export default Career;
