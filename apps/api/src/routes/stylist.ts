import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";
import { management } from "../lib/auth0Management";

const router = Router();

router.post("/", async (req, res) => {
  console.log("Create stylist request body:", req.body);
  try {
    const {
      idToken,
      name,
      email,
      phone,
      address,
      bio,
      yearsOfExperience,
      status,
      specialties,
    } = req.body;

    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);

    const admin = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!admin || admin.role !== "admin")
      return res.status(403).json({ error: "Not allowed" });

    if (!admin.adminSalon)
      return res.status(400).json({ error: "Create salon first" });

    const salonId = admin.adminSalon.id;

    const tempPassword = "Blah@123";

    const auth0User = await management.users.create({
      connection: "Username-Password-Authentication",
      email,
      name,
      password: tempPassword,
      email_verified: false,
      verify_email: false,
      app_metadata: {
        role: "stylist",
        salonId,
      },
    });

    if (!auth0User.user_id) {
  throw new Error("Auth0 user creation failed");
}

auth0Sub: auth0User.user_id,

    //     await management.tickets.changePassword({
    //   user_id: auth0User.user_id,
    //   result_url: "http://localhost:3000/auth/login",
    // });
    await fetch(
      `https://${process.env.AUTH0_DOMAIN}/dbconnections/change_password`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.AUTH0_CLIENT_ID,
          email,
          connection: "Username-Password-Authentication",
        }),
      },
    );
    console.log("Auth0 user created:", auth0User);

    const user = await prisma.user.create({
      data: {
        auth0Sub: auth0User.user_id,
        name,
        email,
        phone,
        address,
        role: "stylist",
      },
    });

    const stylist = await prisma.stylist.create({
      data: {
        userId: user.id,
        salonId,
        bio,
        yearsOfExperience,
        status,
        specialties: {
          create: specialties.map((catId: string) => ({
            categoryId: catId,
          })),
        },
      },
    });

    res.json(stylist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create stylist" });
  }
});

export default router;
