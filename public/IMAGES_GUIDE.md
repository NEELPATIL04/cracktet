# Slideshow Images Guide

To complete the home page slideshow, add the following images to the `public/images/` directory:

## Required Images

### 1. slide1.jpg
- **Suggested Content**: TET exam preparation, students studying, or a classroom setting
- **Dimensions**: 1920x1080px (16:9 aspect ratio recommended)
- **Theme**: Show determination and learning
- **Example**: Students preparing for exams, books, writing

### 2. slide2.jpg
- **Suggested Content**: Study materials, books, educational resources
- **Dimensions**: 1920x1080px (16:9 aspect ratio recommended)
- **Theme**: Knowledge and resources
- **Example**: Stack of books, digital learning, study materials

### 3. slide3.jpg
- **Suggested Content**: Mock tests, exam hall, or assessment scenario
- **Dimensions**: 1920x1080px (16:9 aspect ratio recommended)
- **Theme**: Practice and confidence
- **Example**: Students taking tests, exam papers, assessment materials

## How to Add Images

1. Create the images directory if it doesn't exist:
   ```bash
   mkdir public/images
   ```

2. Add your three images with these exact names:
   - `slide1.jpg`
   - `slide2.jpg`
   - `slide3.jpg`

3. Restart the development server if it's running:
   ```bash
   npm run dev
   ```

## Image Requirements

- **Format**: JPG or PNG (JPG recommended for performance)
- **Size**: Optimize images to be under 500KB each for faster loading
- **Quality**: High quality but compressed
- **Aspect Ratio**: 16:9 (1920x1080) works best for most screens

## Free Stock Photo Resources

You can find suitable images from these free stock photo websites:
- Unsplash (unsplash.com)
- Pexels (pexels.com)
- Pixabay (pixabay.com)

### Search Keywords:
- "students studying"
- "education India"
- "teacher training"
- "exam preparation"
- "learning resources"
- "mock test"
- "classroom India"

## Note

Until you add the images, the slideshow will display with the gradient background and text overlay. The images add an opacity overlay effect, so they won't be fully visible - they serve as background texture.
