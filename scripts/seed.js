const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean up existing records
  await prisma.busVote.deleteMany({});
  await prisma.bus.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.feeInvoice.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed Users
  const student = await prisma.user.create({
    data: {
      id: "u_student_1",
      name: "Aarav Sharma",
      email: "student@hostelhub.in",
      phone: "+91 98765 43210",
      role: "STUDENT",
      hostelId: "h_main",
      roomId: "r_204",
      roomNumber: "204",
      blockName: "Block B",
      parentPhone: "+91 99887 76655",
      password: "demo1234",
    },
  });

  const staff = await prisma.user.create({
    data: {
      id: "u_staff_1",
      name: "Ravi Kumar",
      email: "staff@hostelhub.in",
      phone: "+91 98765 12345",
      role: "STAFF",
      hostelId: "h_main",
      password: "demo1234",
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: "u_admin_1",
      name: "Priya Iyer",
      email: "admin@hostelhub.in",
      phone: "+91 91234 56789",
      role: "ADMIN",
      hostelId: "h_main",
      password: "demo1234",
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      id: "u_super_1",
      name: "Dinesh K",
      email: "dev@hostelhub.in",
      role: "SUPER_ADMIN",
      password: "demo1234",
    },
  });

  console.log("Users seeded successfully!");

  // Seed Announcements
  await prisma.announcement.createMany({
    data: [
      {
        id: "an_1",
        title: "Water tank cleaning — Sunday 10 AM",
        body: "Water supply will be disrupted Sunday 10 AM – 2 PM across all blocks. Please store water in advance.",
        postedById: admin.id,
        postedByName: admin.name,
        pinned: true,
        priority: "HIGH",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        id: "an_2",
        title: "Cricket trials — Friday 5 PM",
        body: "Inter-hostel cricket trials at the main ground. Bring your kit. All years welcome.",
        postedById: staff.id,
        postedByName: staff.name,
        targetRole: "STUDENT",
        pinned: false,
        priority: "NORMAL",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
      },
      {
        id: "an_3",
        title: "Fee due date extended to the 15th",
        body: "All students can pay the monthly fee by the 15th without late penalty. Use the Fees tab.",
        postedById: admin.id,
        postedByName: admin.name,
        targetRole: "STUDENT",
        pinned: true,
        priority: "NORMAL",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      },
      {
        id: "an_4",
        title: "Staff meeting — Monday 9 AM",
        body: "All maintenance and admin staff are requested to attend the Monday morning review.",
        postedById: admin.id,
        postedByName: admin.name,
        targetRole: "STAFF",
        pinned: false,
        priority: "NORMAL",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      },
    ],
  });

  console.log("Announcements seeded successfully!");

  // Seed Buses
  await prisma.bus.createMany({
    data: [
      {
        id: "bus_1",
        name: "City Center",
        time: "07:30",
        description: "Pickup and drop between hostel gate and City Center bus stand.",
        status: "RUNNING",
        upvotes: 248,
        downvotes: 12,
        createdById: admin.id,
        createdByName: admin.name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "bus_2",
        name: "Railway Station",
        time: "06:45",
        description: "Pickup and drop between hostel gate and Railway Station main entrance.",
        status: "LEFT",
        upvotes: 195,
        downvotes: 28,
        createdById: admin.id,
        createdByName: admin.name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: "bus_3",
        name: "Airport Express",
        time: "14:00",
        description: "Weekend airport shuttle. Friday and Sunday only.",
        status: "SCHEDULED",
        upvotes: 87,
        downvotes: 5,
        createdById: admin.id,
        createdByName: admin.name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      {
        id: "bus_4",
        name: "Engineering College",
        time: "08:00",
        description: "Pickup and drop for project work / weekend group studies.",
        status: "CANCELLED",
        upvotes: 32,
        downvotes: 64,
        createdById: admin.id,
        createdByName: admin.name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
    ],
  });

  console.log("Buses seeded successfully!");

  // Seed Complaints
  await prisma.complaint.createMany({
    data: [
      {
        id: "C-2489",
        userId: student.id,
        userName: student.name,
        userRoom: "204 / Block B",
        category: "WIFI",
        title: "WiFi drops in room 204",
        description: "Router in 2nd floor keeps disconnecting every 10 minutes. Affecting online classes.",
        photos: JSON.stringify([]),
        priority: "HIGH",
        status: "IN_PROGRESS",
        assignedToId: staff.id,
        assignedToName: staff.name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "C-2490",
        userId: student.id,
        userName: student.name,
        userRoom: "204 / Block B",
        category: "PLUMBING",
        title: "Leaking tap in common bathroom",
        description: "Cold-water tap on the 2nd floor common bathroom drips constantly.",
        photos: JSON.stringify([]),
        priority: "NORMAL",
        status: "RESOLVED",
        assignedToId: staff.id,
        assignedToName: staff.name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        rating: 5,
      },
      {
        id: "C-2491",
        userId: student.id,
        userName: student.name,
        userRoom: "204 / Block B",
        category: "ELECTRICAL",
        title: "Tube light flickering",
        description: "Tube light in room 204 flickers when AC is on. Probably loose connection.",
        photos: JSON.stringify([]),
        priority: "NORMAL",
        status: "PENDING",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    ],
  });

  console.log("Complaints seeded successfully!");

  // Helper function to build invoice json data for sqlite
  const buildInvoiceComponents = (roomPrice) => {
    return JSON.stringify([
      { name: "Room (Two Seater)", amount: roomPrice },
      { name: "Mess charges", amount: 1500 },
      { name: "Maintenance", amount: 500 },
    ]);
  };

  // Seed Invoices
  await prisma.feeInvoice.createMany({
    data: [
      {
        id: "inv_2026_07",
        userId: student.id,
        roomType: "TWO_SEATER",
        month: "2026-07",
        components: buildInvoiceComponents(6500),
        total: 6500 + 1500 + 500,
        dueDate: "2026-07-15",
        status: "PENDING",
      },
      {
        id: "inv_2026_06",
        userId: student.id,
        roomType: "TWO_SEATER",
        month: "2026-06",
        components: buildInvoiceComponents(6500),
        total: 6500 + 1500 + 500,
        dueDate: "2026-06-10",
        status: "PAID",
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
        transactionId: "txn_inv_2026_06_1715456789000",
      },
      {
        id: "inv_2026_05",
        userId: student.id,
        roomType: "TWO_SEATER",
        month: "2026-05",
        components: buildInvoiceComponents(6500),
        total: 6500 + 1500 + 500,
        dueDate: "2026-05-10",
        status: "PAID",
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 65),
        transactionId: "txn_inv_2026_05_1715456789000",
      },
      {
        id: "inv_2026_04",
        userId: student.id,
        roomType: "TWO_SEATER",
        month: "2026-04",
        components: buildInvoiceComponents(6500),
        total: 6500 + 1500 + 500,
        dueDate: "2026-04-10",
        status: "PAID",
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 95),
        transactionId: "txn_inv_2026_04_1715456789000",
      },
    ],
  });

  console.log("Invoices seeded successfully!");
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
