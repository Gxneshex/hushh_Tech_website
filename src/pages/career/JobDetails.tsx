import React, { ReactNode, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  ListItem,
  Text,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import { Briefcase, ChevronLeft, Clock, DollarSign, MapPin } from "lucide-react";

import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import { careers } from "../../data/career";
import ApplicationForm from "./ApplicationForm";
import {
  appleDisplayFont,
  appleFont,
  brandBlue,
  focusVisible,
  glassCardChrome,
  pageBg,
  sectionHeadingProps,
  textPrimary,
  textSecondary,
} from "./careerTheme";

const metaTextProps = {
  fontSize: "14px",
  fontWeight: "400",
  color: textSecondary,
  lineHeight: "1.4",
};

function LiquidIcon({ icon, size = 44 }: { icon: typeof Briefcase; size?: number }) {
  return (
    <Flex
      align="center"
      justify="center"
      w={`${size}px`}
      h={`${size}px`}
      flexShrink={0}
      borderRadius="16px"
      color={brandBlue}
      bg="rgba(0, 102, 204, 0.1)"
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 24px rgba(29,29,31,0.08)"
    >
      <Icon as={icon} boxSize={`${Math.round(size * 0.45)}px`} strokeWidth={1.8} aria-hidden />
    </Flex>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box p={{ base: 5, md: 7 }} {...glassCardChrome}>
      <Heading as="h2" mb={5} {...sectionHeadingProps} style={{ fontFamily: appleDisplayFont }}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}

function BulletSection({ title, items }: { title: string; items?: string[] }) {
  const visibleItems = (items ?? []).filter((item) => item.trim().length > 0);
  if (!visibleItems.length) return null;

  return (
    <SectionCard title={title}>
      <UnorderedList spacing={3} pl={5} m={0}>
        {visibleItems.map((item, index) => (
          <ListItem key={index} color={textSecondary} fontSize="16px" lineHeight="1.62" fontWeight="300">
            {item}
          </ListItem>
        ))}
      </UnorderedList>
    </SectionCard>
  );
}

const toTitleCase = (str: string) =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());

const JobDetails = () => {
  const { jobId } = useParams();
  const [showForm, setShowForm] = useState(false);
  const job = Object.values(careers)
    .flat()
    .find((j) => j.id === jobId);

  if (!job) {
    return (
      <Box bg={pageBg} minH="100vh" style={{ fontFamily: appleFont }}>
        <HushhTechBackHeader rightType="hamburger" />
        <Container maxW="4xl" pt={{ base: 28, md: 32 }} pb={16} px={{ base: 5, md: 6 }}>
          <Box textAlign="center" p={{ base: 6, md: 8 }} {...glassCardChrome}>
            <Heading
              as="h1"
              fontSize="clamp(32px, 4.6vw, 54px)"
              lineHeight="1.08"
              letterSpacing="-0.025em"
              fontWeight="600"
              color={textPrimary}
              style={{ fontFamily: appleDisplayFont }}
            >
              Position not found.
            </Heading>
            <Button as={Link} to="/career" mt={7} h="48px" px={6} borderRadius="full" bg={brandBlue} color="white">
              Back to careers
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh" style={{ fontFamily: appleFont }}>
      <HushhTechBackHeader rightType="hamburger" />
      <Container maxW="5xl" pt={{ base: 28, md: 32 }} pb={{ base: 12, md: 20 }} px={{ base: 5, md: 6 }}>
        <Button
          as={Link}
          to="/career"
          leftIcon={<ChevronLeft size={18} />}
          variant="ghost"
          color="rgba(29, 29, 31, 0.68)"
          fontWeight="500"
          borderRadius="full"
          mb={5}
          px={4}
          _hover={{ bg: "rgba(29, 29, 31, 0.05)", color: textPrimary, textDecoration: "none" }}
          {...focusVisible}
        >
          Back to careers
        </Button>

        <VStack spacing={{ base: 5, md: 6 }} align="stretch">
          <Box p={{ base: 6, md: 8 }} {...glassCardChrome}>
            <Text
              mb="18px"
              fontSize="13px"
              fontWeight="700"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color={brandBlue}
              lineHeight="1.1"
            >
              Open role
            </Text>
            <Heading
              as="h1"
              fontSize="clamp(32px, 4.6vw, 54px)"
              lineHeight="1.08"
              letterSpacing="-0.025em"
              fontWeight="600"
              color={textPrimary}
              style={{ fontFamily: appleDisplayFont, textWrap: "balance" }}
            >
              {job.title}
            </Heading>

            <Flex
              flexWrap="wrap"
              alignItems="center"
              gap={{ base: 3, md: 5 }}
              mt={{ base: 6, md: 7 }}
            >
              {job.location && (
                <HStack spacing={2.5}>
                  <LiquidIcon icon={MapPin} size={38} />
                  <Text {...metaTextProps}>{job.location}</Text>
                </HStack>
              )}

              {job.salary && (
                <HStack spacing={2.5}>
                  <LiquidIcon icon={DollarSign} size={38} />
                  <Text {...metaTextProps}>{job.salary}</Text>
                </HStack>
              )}

              <HStack spacing={2.5}>
                <LiquidIcon icon={Clock} size={38} />
                <Text {...metaTextProps}>Full-time</Text>
              </HStack>
            </Flex>

            <Button
              onClick={() => setShowForm(true)}
              mt={{ base: 7, md: 8 }}
              h="52px"
              px={8}
              borderRadius="full"
              bg={brandBlue}
              color="white"
              fontSize="16px"
              fontWeight="500"
              letterSpacing="-0.01em"
              boxShadow="0 14px 30px rgba(0, 102, 204, 0.22)"
              _hover={{ bg: "#0057B8" }}
              _active={{ transform: "scale(0.98)" }}
              {...focusVisible}
            >
              Apply now
            </Button>
          </Box>

          <SectionCard title="About HushhTech">
            <VStack spacing={4} align="stretch">
              <Text color={textSecondary} fontSize="16px" lineHeight="1.62" fontWeight="300">
                Hushh Technologies LLC is an investment technology firm that combines artificial
                intelligence, quantitative research, and careful product design to improve how
                capital is analyzed and allocated.
              </Text>
              <Text color={textSecondary} fontSize="16px" lineHeight="1.62" fontWeight="300">
                Our team includes researchers, engineers, and investment professionals who care about
                durable systems, clear thinking, and long-term value creation.
              </Text>
            </VStack>
          </SectionCard>

          <BulletSection title="Responsibilities" items={job.responsibilities} />
          <BulletSection title="Skills, qualifications, and experience" items={job.qualifications} />
          <BulletSection title="Leadership principles" items={job.leadershipPrinciples} />
          <BulletSection title="Hiring procedure" items={job.hiringProcedure} />
          <BulletSection title="Compensation procedure" items={job.compensationProcedure} />

          {job.salaryDetails && (
            <SectionCard title="Salary details">
              <VStack spacing={5} align="stretch" divider={<Divider borderColor="rgba(29, 29, 31, 0.08)" />}>
                {Object.entries(job.salaryDetails).map(([role, details], index) => (
                  <Box key={index}>
                    <Text fontWeight="600" color={textPrimary} mb={2} fontSize="16px">
                      {toTitleCase(role.replace(/([A-Z])/g, " $1").trim())}
                    </Text>
                    <VStack spacing={1.5} align="start">
                      {details.averageSalary && (
                        <Text color={textSecondary} fontSize="15px" lineHeight="1.55" fontWeight="300">
                          Average salary: {details.averageSalary}
                        </Text>
                      )}
                      {details.range && (
                        <Text color={textSecondary} fontSize="15px" lineHeight="1.55" fontWeight="300">
                          Range: {details.range}
                        </Text>
                      )}
                      {details.competitiveSalaryRange && (
                        <Box w="100%">
                          <Text color={textSecondary} fontSize="15px" mb={2} fontWeight="300">
                            Competitive salary range:
                          </Text>
                          <VStack spacing={2} align="start">
                            {Object.entries(details.competitiveSalaryRange).map(([level, range], idx) => (
                              <Text key={idx} color={textSecondary} fontSize="15px" lineHeight="1.55" fontWeight="300">
                                <Badge
                                  mr={2}
                                  borderRadius="full"
                                  px={2.5}
                                  py={1}
                                  bg="rgba(0, 102, 204, 0.08)"
                                  color={brandBlue}
                                  fontWeight="600"
                                >
                                  {level.charAt(0).toUpperCase() + level.slice(1)}
                                </Badge>
                                {range}
                              </Text>
                            ))}
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </SectionCard>
          )}
        </VStack>

        {showForm && (
          <ApplicationForm jobTitle={job.title} jobLocation={job.location} onClose={() => setShowForm(false)} />
        )}
      </Container>
    </Box>
  );
};

export default JobDetails;
