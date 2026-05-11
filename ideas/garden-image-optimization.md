# Optimize Garden Page Images

The garden pages currently load large Cloudinary-hosted images directly from JSON. This works, but it could make the page heavy as more photos are added.

Idea: add optimized Cloudinary transforms to the garden image URLs before rendering them. The page could request smaller responsive images, use modern formats like WebP or AVIF, and load full-size images only when someone opens an image directly.

Possible approach:

- Store the original Cloudinary image IDs in `public/garden/*.json`.
- Add a small helper that builds optimized image URLs with width, quality, and format transforms.
- Render thumbnail-sized images on the garden page with `loading="lazy"`.
- Link each thumbnail to the original image or a larger optimized version.
- Consider adding `srcset` sizes for mobile and desktop layouts.

This should keep the page feeling the same while reducing bandwidth and improving load time.
