import { db } from "./db";
import { products } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Clear existing products
  await db.delete(products);

  // Seed Apparel products
  const apparelProducts = [
    {
      title: "Short Sleeve T-Shirt",
      price: "30.00",
      category: "T-Shirts",
      description: "Standard weight cotton/blend tee. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.",
      imageUrl: "/assets/generated_images/black_t-shirt_design.png",
      productType: "apparel",
    },
    {
      title: "Long Sleeve T-Shirt",
      price: "38.00",
      category: "T-Shirts",
      description: "Standard weight cotton/blend tee. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.",
      imageUrl: "/assets/generated_images/black_t-shirt_design.png",
      productType: "apparel",
    },
    {
      title: "Pullover Hoodie",
      price: "37.98",
      category: "Hoodies",
      description: "Mid to Heavyweight cotton/fleece hooded sweatshirt. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo. Amazon-fulfilled — FREE shipping included.",
      imageUrl: "/assets/generated_images/hoodie_khomplete_khemistri_text.png",
      productType: "apparel",
    },
    {
      title: "Full-Zip Hoodie",
      price: "37.98",
      category: "Hoodies",
      description: "Mid to Heavyweight cotton/fleece full-zip hooded sweatshirt. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo. Amazon-fulfilled — FREE shipping included.",
      imageUrl: "/assets/generated_images/full-zip_hoodie_branded.png",
      productType: "apparel",
    },
    {
      title: "Jacket/Coat",
      price: "85.00",
      category: "Outerwear",
      description: "Lightweight jacket (e.g., Windbreaker, Coach Jacket) or Fleece Jacket. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.",
      imageUrl: "/assets/generated_images/white_hoodie_design.png",
      productType: "apparel",
    },
  ];

  // Seed Accessories
  const accessoryProducts = [
    {
      title: "Royal Purple Tumbler",
      price: "10.00",
      category: "Drinkware",
      description: "Insulated tumbler with Khomplete Khemistri branding",
      imageUrl: "/assets/20251126_232618_1764218150041.jpg",
      productType: "accessory",
    },
    {
      title: "Classic White Tumbler",
      price: "10.00",
      category: "Drinkware",
      description: "Insulated tumbler with Khomplete Khemistri branding",
      imageUrl: "/assets/20251126_232642_1764218160091.jpg",
      productType: "accessory",
    },
    {
      title: "Strike Orange Tumbler",
      price: "10.00",
      category: "Drinkware",
      description: "Insulated tumbler with Khomplete Khemistri branding",
      imageUrl: "/assets/20251126_232603_1764218167991.jpg",
      productType: "accessory",
    },
    {
      title: "Matte Black Mug",
      price: "25.00",
      category: "Drinkware",
      description: "Premium ceramic mug with Khomplete Khemistri logo",
      imageUrl: "/assets/generated_images/black_branded_mug.png",
      productType: "accessory",
    },
    {
      title: "Chemistry Socks",
      price: "18.00",
      category: "Socks",
      description: "Comfortable branded socks",
      imageUrl: "/assets/generated_images/patterned_socks.png",
      productType: "accessory",
    },
    {
      title: "Executive Umbrella",
      price: "45.00",
      category: "Lifestyle",
      description: "Luxury branded umbrella",
      imageUrl: "/assets/stock_images/black_luxury_umbrell_be8b2074.jpg",
      productType: "accessory",
    },
    {
      title: "Signature Scent Candle",
      price: "35.00",
      category: "Home",
      description: "Premium scented candle",
      imageUrl: "/assets/stock_images/luxury_scented_candl_c8705703.jpg",
      productType: "accessory",
    },
  ];

  await db.insert(products).values([...apparelProducts, ...accessoryProducts]);

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
