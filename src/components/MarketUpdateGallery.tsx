import React, { useState, useEffect, useId, useMemo } from 'react';
import { 
  Box, 
  Heading, 
  Image, 
  SimpleGrid, 
  Text, 
  Spinner,
  Skeleton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  useDisclosure,
  IconButton,
  Flex
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@chakra-ui/icons';

const bundledMarketImages = import.meta.glob(
  './images/market-updates/**/*.{png,jpg,jpeg}',
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
) as Record<string, string>;

interface MarketUpdateGalleryProps {
  date: string; // Format: 'dmu14mar' or 'DD/MM/YYYY'
  showTestImage?: boolean;
  title?: string;
  imageCount?: number;
  apiDateFormat?: boolean; // Flag to indicate if date is in DD/MM/YYYY format
}

const MarketUpdateGallery: React.FC<MarketUpdateGalleryProps> = ({
  date,
  showTestImage = false,
  title = "Supporting Charts & Data",
  imageCount = 6,
  apiDateFormat = false
}) => {
  const [images, setImages] = useState<{name: string, url: string}[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const galleryHeadingId = useId();
  const modalTitleId = useId();
  
  // Format the folder path based on date format
  const formatFolderPath = (dateStr: string, isApiFormat: boolean): string => {
    if (isApiFormat && dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      // For DD/MM/YYYY format
      return `market-updates/${dateStr}`;
    } else {
      // For 'dmuXXmon' format
      return `market-updates/${dateStr}`;
    }
  };
  
  const folderPath = formatFolderPath(date, apiDateFormat);
  const bundledImagesForFolder = useMemo(
    () =>
      Object.entries(bundledMarketImages)
        .filter(([path]) => path.includes(`/${folderPath}/`))
        .map(([path, url]) => ({
          name: path.split('/').pop() || path,
          url,
        })),
    [folderPath],
  );
  
  // Common image extensions to try
  const extensions = ['.png', '.jpg', '.jpeg'];
  
  useEffect(() => {
    setIsLoading(true);
    
    const possibleImages = [...bundledImagesForFolder];
    
    // Try the expected image count against the same-origin GCP asset API.
    for (let i = 1; i <= imageCount; i++) {
      for (const ext of extensions) {
        possibleImages.push({
          name: `${i}${ext}`,
          url: `/api/community/assets/${folderPath}/${i}${ext}`
        });
      }
    }
    
    // Set up image loading
    const loadedImages: {name: string, url: string}[] = [];
    const imagePromises: Promise<void>[] = [];
    
    // Try to load each possible image
    possibleImages.forEach(image => {
      const promise = new Promise<void>((resolve) => {
        const img = document.createElement('img');
        img.onload = () => {
          loadedImages.push(image);
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
        img.src = image.url;
      });
      
      imagePromises.push(promise);
    });
    
    // When all images have been tried, update state with the ones that loaded
    Promise.all(imagePromises).then(() => {
      // Sort images numerically by name (1.png, 2.png, etc.)
      const sortedImages = loadedImages.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
        return numA - numB;
      });
      
      setImages(sortedImages);
      setIsLoading(false);
    });
  }, [date, folderPath, apiDateFormat, bundledImagesForFolder, imageCount]);

  const handleImageLoad = (imageName: string) => {
    setImagesLoaded(prev => ({
      ...prev,
      [imageName]: true
    }));
  };

  const getChartLabel = (imageName: string) => imageName.match(/\d+/)?.[0] || imageName;

  const handleImageClick = (imageIndex: number) => {
    setSelectedImageIndex(imageIndex);
    onOpen();
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex(currentIndex => {
      if (currentIndex === null || images.length === 0) {
        return currentIndex;
      }

      return (currentIndex - 1 + images.length) % images.length;
    });
  };

  const handleNextImage = () => {
    setSelectedImageIndex(currentIndex => {
      if (currentIndex === null || images.length === 0) {
        return currentIndex;
      }

      return (currentIndex + 1) % images.length;
    });
  };

  const selectedImage = selectedImageIndex === null ? null : images[selectedImageIndex];
  const hasCarouselControls = images.length > 1 && selectedImageIndex !== null;

  // Generate skeleton placeholders
  const renderSkeletons = () => {
    return Array(imageCount).fill(0).map((_, index) => (
      <Box 
        key={`skeleton-${index}`} 
        borderRadius="lg" 
        overflow="hidden"
        boxShadow="md"
        bg="white"
        p={2}
      >
        <Skeleton
          height="300px"
          fadeDuration={1}
          borderRadius="md"
          startColor="gray.100"
          endColor="gray.300"
          speed={1.2}
        />
      </Box>
    ));
  };

  return (
    <Box as="section" mt={8} aria-labelledby={galleryHeadingId}>
      <Heading
        as="h3"
        id={galleryHeadingId}
        fontSize="lg"
        color="black"
        mb={4}
      >
        {title}
      </Heading>
      
      {/* Gallery of images */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {isLoading ? (
          // Show skeletons while loading
          renderSkeletons()
        ) : images.length > 0 ? (
          // Show actual images once loaded
          images.map((image, index) => (
            <Box 
              as="button"
              type="button"
              key={image.name} 
              borderRadius="lg" 
              overflow="hidden"
              boxShadow="md"
              bg="white"
              p={2}
              position="relative"
              cursor="pointer"
              onClick={() => handleImageClick(index)}
              aria-label={`Open market analysis chart ${getChartLabel(image.name)}`}
              textAlign="left"
              transition="transform 0.2s"
              _hover={{ transform: 'scale(1.02)' }}
              _focus={{ outline: 'none' }}
              _focusVisible={{
                boxShadow: '0 0 0 3px rgba(43, 140, 238, 0.55)',
                outline: 'none',
              }}
            >
              {/* Skeleton loader */}
              <Skeleton
                isLoaded={imagesLoaded[image.name]}
                fadeDuration={1}
                borderRadius="md"
                startColor="gray.100"
                endColor="gray.300"
                speed={1.2}
              >
                <Image
                  src={image.url}
                  alt={`Market Analysis Chart ${getChartLabel(image.name)}`}
                  borderRadius="md"
                  objectFit="contain"
                  w="100%"
                  minH="300px"
                  maxH="400px"
                  loading="lazy"
                  bg="gray.50"
                  onLoad={() => handleImageLoad(image.name)}
                  onError={(e) => {
                    const parent = e.currentTarget.parentElement?.parentElement;
                    if (parent) {
                      parent.style.display = 'none';
                    }
                  }}
                />
              </Skeleton>

              {/* Optional loading spinner overlay */}
              {!imagesLoaded[image.name] && (
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  zIndex="1"
                >
                  <Spinner
                    aria-hidden="true"
                    size="md"
                    color="blue.500"
                    thickness="3px"
                    speed="0.8s"
                  />
                </Box>
              )}
            </Box>
          ))
        ) : (
          // Show a message if no images were found
          <Box textAlign="center" gridColumn="1 / -1" py={8}>
            <Text color="gray.500">No images available for this update.</Text>
          </Box>
        )}
      </SimpleGrid>

      {/* Full-screen image modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent
          bg="transparent"
          maxW="100vw"
          maxH="100vh"
          m={0}
          p={0}
          aria-labelledby={selectedImage ? modalTitleId : undefined}
        >
          <ModalBody p={0} display="flex" alignItems="center" justifyContent="center">
            {selectedImage && (
              <Text
                as="h2"
                id={modalTitleId}
                className="sr-only"
                position="absolute"
                w="1px"
                h="1px"
                p={0}
                m="-1px"
                overflow="hidden"
                clipPath="inset(50%)"
                whiteSpace="nowrap"
                borderWidth={0}
              >
                Enlarged market analysis chart {getChartLabel(selectedImage.name)}
              </Text>
            )}
            <Flex 
              position="absolute" 
              top={4} 
              right={4} 
              zIndex={2}
            >
              <IconButton
                aria-label="Close enlarged chart"
                icon={<CloseIcon />}
                onClick={onClose}
                colorScheme="whiteAlpha"
                variant="ghost"
                size="lg"
                _focus={{ outline: 'none' }}
                _focusVisible={{
                  boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.95)',
                  outline: 'none',
                }}
              />
            </Flex>
            {hasCarouselControls && (
              <>
                <IconButton
                  aria-label="Show previous market analysis chart"
                  icon={<ChevronLeftIcon boxSize={8} />}
                  onClick={handlePreviousImage}
                  colorScheme="whiteAlpha"
                  variant="solid"
                  size="lg"
                  position="absolute"
                  left={{ base: 3, md: 6 }}
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={2}
                  _focus={{ outline: 'none' }}
                  _focusVisible={{
                    boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.95)',
                    outline: 'none',
                  }}
                />
                <IconButton
                  aria-label="Show next market analysis chart"
                  icon={<ChevronRightIcon boxSize={8} />}
                  onClick={handleNextImage}
                  colorScheme="whiteAlpha"
                  variant="solid"
                  size="lg"
                  position="absolute"
                  right={{ base: 3, md: 6 }}
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={2}
                  _focus={{ outline: 'none' }}
                  _focusVisible={{
                    boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.95)',
                    outline: 'none',
                  }}
                />
              </>
            )}
            {selectedImage && (
              <Image
                src={selectedImage.url}
                alt={`Full-screen market analysis chart ${getChartLabel(selectedImage.name)}`}
                maxH="95vh"
                maxW="95vw"
                objectFit="contain"
                onClick={onClose}
                cursor="pointer"
                decoding="async"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MarketUpdateGallery;
