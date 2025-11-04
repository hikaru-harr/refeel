import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

async function main() {
	const p = await prisma.photo.create({
		data: {
			userId: "1",
			objectKey: "uploads/2025/11/04/img-0001.jpg",
			mime: "image/jpeg",
			bytes: 1024,
			width: 1024,
			height: 768,
		},
	});
	console.log("Inserted:", p.id);
}

main().finally(() => prisma.$disconnect());
