import React, { useCallback, useMemo, useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Button, VStack, Text, useToast, Box, Select
} from '@chakra-ui/react';
import {
  appleDisplayFont,
  appleFont,
  brandBlue,
  fieldChrome,
  focusVisible,
  textPrimary,
  textSecondary,
} from "./careerTheme";

interface ApplicationFormProps {
  jobTitle: string;
  jobLocation: string;
  onClose: () => void;
}

type ApplicationFormState = {
  firstName: string;
  lastName: string;
  email: string;
  collegeEmail: string;
  officialEmail: string;
  phone: string;
  resumeLink: string;
  college: string; // value (LPU/MIT)
};

const ALLOWED_COLLEGES = [
  { value: 'LPU', label: 'Lovely Professional University (LPU)' },
  { value: 'MIT', label: 'Manipal Institute of Technology (MIT)' },
];

const initialState: ApplicationFormState = {
  firstName: '', lastName: '', email: '',
  collegeEmail: '', officialEmail: '', phone: '',
  resumeLink: '', college: '',
};

const ApplicationForm = ({ jobTitle, jobLocation, onClose }: ApplicationFormProps) => {
  const [formData, setFormData] = useState<ApplicationFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const allowedCollegeValues = useMemo(
    () => new Set(ALLOWED_COLLEGES.map(({ value }) => value)), []
  );

  const updateFormField = useCallback(
    <K extends keyof ApplicationFormState>(field: K, value: ApplicationFormState[K]) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []
  );

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sanitized: ApplicationFormState = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        collegeEmail: formData.collegeEmail.trim(),
        officialEmail: 'not required',
        phone: formData.phone.trim(),
        resumeLink: formData.resumeLink.trim(),
        college: formData.college.trim(),
      };

      const required: (keyof ApplicationFormState)[] = [
        'firstName','lastName','email','collegeEmail','officialEmail','phone','resumeLink','college'
      ];
      const missing = required.find(f => !sanitized[f]);
      if (missing) throw new Error('Please complete all required fields before submitting');

      if (!allowedCollegeValues.has(sanitized.college)) {
        throw new Error('Please select a valid college option');
      }
      if (!isValidUrl(sanitized.resumeLink)) {
        throw new Error('Please enter a valid resume link');
      }

      const selectedCollege =
        ALLOWED_COLLEGES.find(({ value }) => value === sanitized.college)?.label ?? sanitized.college;

      const applicationData = {
        ...sanitized,
        college: selectedCollege,           // label
        collegeValue: sanitized.college,    // value (LPU/MIT)
        jobTitle,
        jobLocation,
        submittedAt: new Date().toISOString(),
      };

      const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL as string;
      if (!appsScriptUrl) throw new Error('Apps Script URL not configured');

      const resp = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // avoids CORS preflight
        body: JSON.stringify(applicationData),
      });

      const text = await resp.text();
      let data: any = null; try { data = text ? JSON.parse(text) : null; } catch {}

      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || text || 'Submission failed');
      }

      toast({ title: 'Application submitted successfully!', status: 'success', duration: 5000, isClosable: true });
      setFormData(initialState);
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      toast({
        title: 'Application failed',
        description: err instanceof Error ? err.message : 'Error submitting application. Please try again.',
        status: 'error', duration: 6000, isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="rgba(0,0,0,0.42)" backdropFilter="blur(10px)" />
      <ModalContent
        borderRadius="24px"
        mx={4}
        bg="rgba(255,255,255,0.94)"
        border="1px solid rgba(29,29,31,0.08)"
        boxShadow="0 28px 90px rgba(29,29,31,0.18), inset 0 1px 0 rgba(255,255,255,0.8)"
        style={{ fontFamily: appleFont }}
      >
        <ModalHeader
          pt={7}
          pb={2}
          pr={14}
          color={textPrimary}
          fontSize="24px"
          fontWeight="600"
          letterSpacing="-0.022em"
          lineHeight="1.12"
          style={{ fontFamily: appleDisplayFont }}
        >
          Apply for {jobTitle}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="500" fontSize="13px" color="rgba(29, 29, 31, 0.62)" mb={1.5}>
                  First Name
                </FormLabel>
                <Input
                  h="50px"
                  value={formData.firstName}
                  onChange={(e)=>updateFormField('firstName', e.target.value)}
                  {...fieldChrome}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="500" fontSize="13px" color="rgba(29, 29, 31, 0.62)" mb={1.5}>
                  Last Name
                </FormLabel>
                <Input
                  h="50px"
                  value={formData.lastName}
                  onChange={(e)=>updateFormField('lastName', e.target.value)}
                  {...fieldChrome}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="500" fontSize="13px" color="rgba(29, 29, 31, 0.62)" mb={1.5}>
                  Email
                </FormLabel>
                <Input
                  h="50px"
                  type="email"
                  value={formData.email}
                  onChange={(e)=>updateFormField('email', e.target.value)}
                  {...fieldChrome}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="500" fontSize="13px" color="rgba(29, 29, 31, 0.62)" mb={1.5}>
                  College Email
                </FormLabel>
                <Input
                  h="50px"
                  type="email"
                  value={formData.collegeEmail}
                  onChange={(e)=>updateFormField('collegeEmail', e.target.value)}
                  {...fieldChrome}
                />
              </FormControl>

              {/* <FormControl isRequired>
                <FormLabel>Official Email</FormLabel>
                <Input type="email" value={formData.officialEmail} onChange={(e)=>updateFormField('officialEmail', e.target.value)} />
              </FormControl> */}

              <FormControl isRequired>
                <FormLabel fontWeight="500" fontSize="13px" color="rgba(29, 29, 31, 0.62)" mb={1.5}>
                  Phone Number
                </FormLabel>
                <Box
                  borderWidth="1px"
                  borderColor="rgba(29, 29, 31, 0.08)"
                  borderRadius="14px"
                  bg="rgba(249, 250, 251, 0.78)"
                  p={1}
                  boxShadow="inset 0 1px 0 rgba(255, 255, 255, 0.75)"
                >
                  <PhoneInput
                    country="us"
                    value={formData.phone}
                    onChange={(phone)=>updateFormField('phone', phone)}
                    inputStyle={{
                      width:'100%',
                      border:'none',
                      outline:'none',
                      background:'transparent',
                      height: '42px',
                      color: textPrimary,
                      fontSize: '15px',
                      fontFamily: appleFont,
                    }}
                    buttonStyle={{ border:'none', background:'none' }}
                  />
                </Box>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="500" fontSize="13px" color="rgba(29, 29, 31, 0.62)" mb={1.5}>
                  College
                </FormLabel>
                <Select
                  placeholder="Select your college"
                  value={formData.college}
                  onChange={(e)=>updateFormField('college', e.target.value)}
                  h="50px"
                  {...fieldChrome}
                >
                  {ALLOWED_COLLEGES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="500" fontSize="13px" color="rgba(29, 29, 31, 0.62)" mb={1.5}>
                  Resume Link
                </FormLabel>
                <Input
                  h="50px"
                  type="url"
                  value={formData.resumeLink}
                  onChange={(e)=>updateFormField('resumeLink', e.target.value)}
                  placeholder="https://drive.google.com/your-resume-link"
                  {...fieldChrome}
                />
                <Text fontSize="13px" color={textSecondary} mt={1.5} fontWeight="300">
                  Please provide a public link to your resume.
                </Text>
              </FormControl>

              <Button
                type="submit"
                h="50px"
                isLoading={loading}
                w="100%"
                mt={4}
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
                Submit Application
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ApplicationForm;
