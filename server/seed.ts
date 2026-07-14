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
      price: "55.00",
      category: "Hoodies",
      description: "Mid to Heavyweight cotton/fleece hooded sweatshirt. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.",
      imageUrl: "/assets/generated_images/white_hoodie_design.png",
      productType: "apparel",
    },
    {
      title: "Full-Zip Hoodie",
      price: "65.00",
      category: "Hoodies",
      description: "Mid to Heavyweight cotton/fleece full-zip hooded sweatshirt. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.",
      imageUrl: "/assets/generated_images/white_hoodie_design.png",
      productType: "apparel",
    },
    {
      title: "Men's Softshell Jacket",
      price: "75.00",
      category: "Outerwear",
      description:
        "Personalized men's waterproof softshell windbreaker / hiking raincoat with your choice of any Khomplete Khemistri logo. SELECT YOUR COLOR, SIZE, AND LOGO at checkout. Available in a wide range of colors, sizes S through 3XL. FREE shipping included.",
      imageUrl: "/assets/jacket_front.jpg",
      productType: "apparel",
    },
    {
      title: "Women's Softshell Jacket",
      price: "75.00",
      category: "Outerwear",
      description:
        "Personalized women's waterproof softshell windbreaker / hiking raincoat with your choice of any Khomplete Khemistri logo. SELECT YOUR COLOR, SIZE, AND LOGO at checkout. Available in a wide range of colors, sizes S through 3XL. FREE shipping included.",
      imageUrl: "/assets/kk_womens_softshell_jacket.jpg",
      productType: "apparel",
    },
    {
      title: "Personalized Custom Logo Jeans",
      price: "57.48",
      category: "Jeans",
      description:
        "Personalized custom logo men's jeans with reflective stripes. SELECT YOUR COLOR, SIZE (waist × inseam), AND LOGO at checkout. Available in 10 colorways and waist sizes 27–48. FREE shipping included.",
      imageUrl: "/assets/kk_custom_logo_jeans.jpg",
      productType: "apparel",
    },
    {
      title: "Personalized Custom Logo Shorts",
      price: "25.00",
      category: "Shorts",
      description:
        "Branded men's mesh athletic shorts with Khomplete Khemistri logo on the left thigh. SELECT YOUR COLOR, SIZE, AND LOGO at checkout. Available in 31 colorways, sizes S through 3XL.",
      imageUrl: "/assets/kk_custom_logo_shorts.jpg",
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
