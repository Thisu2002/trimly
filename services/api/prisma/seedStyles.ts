import { prisma } from "../src/lib/prisma.ts";

async function main() {
  const styles = [
    { name: "Layered Bob", category: "Haircut" },
    { name: "Textured Lob", category: "Haircut" },
    { name: "Crew Cut", category: "Haircut" },
    { name: "Pixie Cut", category: "Haircut" },
    { name: "Balayage", category: "Color" },
    { name: "Highlights", category: "Color" },
    { name: "Keratin Treatment", category: "Treatment" },
    { name: "Hair Spa", category: "Treatment" },
    { name: "Blow Dry", category: "Styling" },
    { name: "Deep Conditioning", category: "Treatment" },
  ];

  for (const style of styles) {
    await prisma.style.upsert({
      where: { name: style.name },
      update: {},
      create: style,
    });
  }

  console.log("Styles seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });