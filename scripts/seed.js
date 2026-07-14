const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean up existing records
  await prisma.busVote.deleteMany({});
  await prisma.bus.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.feeInvoice.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed Users: 3 Admins
  const adminNames = ["Priya Iyer", "Karan Johar", "Ekta Kapoor"];
  const admins = [];
  for (let i = 0; i < adminNames.length; i++) {
    const admin = await prisma.user.create({
      data: {
        id: i === 0 ? "u_admin_1" : `u_admin_gen_${i}`,
        name: adminNames[i],
        email: i === 0 ? "admin@hostelhub.in" : `admin${i}@hostelhub.in`,
        phone: `+91 91234 ${50000 + i}`,
        role: "ADMIN",
        hostelId: "h_main",
        password: bcrypt.hashSync("demo1234", 10),
        active: true,
      },
    });
    admins.push(admin);
  }

  // Seed Users: 10 Staff
  const staffNames = [
    "Ravi Kumar", "Sunil Dutt", "Anil Kapoor", "Suresh Raina", 
    "Manoj Tiwari", "Dinesh Karthik", "Naresh Goyal", 
    "Harish Salve", "Rakesh Jhunjhunwala", "Umesh Yadav"
  ];
  const staffMembers = [];
  for (let i = 0; i < staffNames.length; i++) {
    const staff = await prisma.user.create({
      data: {
        id: i === 0 ? "u_staff_1" : `u_staff_gen_${i}`,
        name: staffNames[i],
        email: i === 0 ? "staff@hostelhub.in" : `staff${i}@hostelhub.in`,
        phone: `+91 98765 ${20000 + i}`,
        role: "STAFF",
        hostelId: "h_main",
        password: bcrypt.hashSync("demo1234", 10),
        active: true,
      },
    });
    staffMembers.push(staff);
  }

  // Seed Users: 1 Super Admin (Developer Account)
  const superAdmin = await prisma.user.create({
    data: {
      id: "u_super_1",
      name: "Dinesh K",
      email: "dev@hostelhub.in",
      role: "SUPER_ADMIN",
      password: bcrypt.hashSync("demo1234", 10),
      active: true,
    },
  });

  // Seed Users: 100 Students (grouped by room capacities)
  const studentFirstNames = ["Aarav", "Vihaan", "Aditya", "Arjun", "Siddharth", "Ishaan", "Pranav", "Kabir", "Neha", "Ananya", "Riya", "Diya", "Pooja", "Sanya", "Sneha", "Karan", "Rahul", "Varun", "Amit", "Sanjay", "Deepak", "Vikram", "Sunil", "Anil", "Rajesh", "Suresh", "Ramesh", "Vijay", "Ajay", "Manoj", "Dinesh", "Naresh", "Harish", "Rakesh", "Umesh", "Mukesh", "Pradeep", "Sandeep", "Kuldeep", "Jaspal", "Manpreet", "Gurpreet", "Harpreet", "Jaswinder", "Balwinder"];
  const studentLastNames = ["Sharma", "Verma", "Kumar", "Iyer", "Nair", "Patel", "Mehta", "Joshi", "Gupta", "Rao", "Reddy", "Choudhury", "Singh", "Gill", "Sandhu", "Dhillon", "Cheema", "Sidhu", "Chahal", "Grewal", "Mishra", "Pandey", "Trivedi", "Banerjee", "Mukherjee", "Roy", "Sarkar", "Dutta", "Das", "Bose"];

  const roomTypes = ["FOUR_SEATER", "THREE_SEATER", "TWO_SEATER", "SINGLE_SEATER", "PVT_DELUXE"];
  const blocks = ["Block A", "Block B", "Block C"];

  const students = [];
  let studentCount = 0;
  let roomNumberIndex = 101;

  while (studentCount < 100) {
    const block = blocks[Math.floor(Math.random() * blocks.length)];
    const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
    
    let capacity = 1;
    if (roomType === "FOUR_SEATER") capacity = 4;
    else if (roomType === "THREE_SEATER") capacity = 3;
    else if (roomType === "TWO_SEATER") capacity = 2;

    const currentRoomNumber = `${roomNumberIndex}`;
    roomNumberIndex++;

    for (let c = 0; c < capacity; c++) {
      if (studentCount >= 100) break;

      const fn = studentFirstNames[studentCount % studentFirstNames.length];
      const ln = studentLastNames[(studentCount * 3) % studentLastNames.length];
      const name = `${fn} ${ln}`;
      const email = studentCount === 0 ? "student@hostelhub.in" : `student${studentCount + 1}@hostelhub.in`;

      const student = await prisma.user.create({
        data: {
          id: studentCount === 0 ? "u_student_1" : `u_student_gen_${studentCount + 1}`,
          name: studentCount === 0 ? "Aarav Sharma" : name,
          email,
          phone: studentCount === 0 ? "+91 98765 43210" : `+91 98765 ${String(10000 + studentCount).slice(1)}`,
          role: "STUDENT",
          hostelId: "h_main",
          roomId: `r_${currentRoomNumber}`,
          roomNumber: currentRoomNumber,
          blockName: block,
          parentPhone: studentCount === 0 ? "+91 99887 76655" : `+91 99887 ${String(50000 + studentCount).slice(1)}`,
          password: bcrypt.hashSync("demo1234", 10),
          active: true,
        },
      });

      students.push({
        id: student.id,
        roomType,
      });
      studentCount++;
    }
  }

  console.log("100 Students, 10 Staff, 3 Admins seeded successfully!");

  // Seed Announcements
  await prisma.announcement.createMany({
    data: [
      {
        id: "an_1",
        title: "Water tank cleaning — Sunday 10 AM",
        body: "Water supply will be disrupted Sunday 10 AM – 2 PM across all blocks. Please store water in advance.",
        postedById: admins[0].id,
        postedByName: admins[0].name,
        pinned: true,
        priority: "HIGH",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        id: "an_2",
        title: "Cricket trials — Friday 5 PM",
        body: "Inter-hostel cricket trials at the main ground. Bring your kit. All years welcome.",
        postedById: staffMembers[0].id,
        postedByName: staffMembers[0].name,
        targetRole: "STUDENT",
        pinned: false,
        priority: "NORMAL",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
      },
      {
        id: "an_3",
        title: "Fee due date extended to the 15th",
        body: "All students can pay the monthly fee by the 15th without late penalty. Use the Fees tab.",
        postedById: admins[0].id,
        postedByName: admins[0].name,
        targetRole: "STUDENT",
        pinned: true,
        priority: "NORMAL",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      },
      {
        id: "an_4",
        title: "Staff meeting — Monday 9 AM",
        body: "All maintenance and admin staff are requested to attend the Monday morning review.",
        postedById: admins[0].id,
        postedByName: admins[0].name,
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
        name: "City Center Shuttle",
        time: "07:30",
        description: "Daily pickup and drop between hostel gate and City Center bus stand.",
        status: "RUNNING",
        upvotes: 248,
        downvotes: 12,
        createdById: admins[0].id,
        createdByName: admins[0].name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "bus_2",
        name: "Railway Station Connection",
        time: "06:45",
        description: "Pickup and drop between hostel gate and Railway Station main entrance.",
        status: "LEFT",
        upvotes: 195,
        downvotes: 28,
        createdById: admins[0].id,
        createdByName: admins[0].name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: "bus_3",
        name: "Campus Loop (Sunday Only)",
        time: "14:00",
        description: "Weekend academic shuttle. Runs every hour.",
        status: "SCHEDULED",
        upvotes: 87,
        downvotes: 5,
        createdById: admins[0].id,
        createdByName: admins[0].name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    ],
  });

  console.log("Buses seeded successfully!");

  // Seed Complaints
  await prisma.complaint.createMany({
    data: [
      {
        id: "C-2489",
        userId: "u_student_1",
        userName: "Aarav Sharma",
        userRoom: "101 / Block A",
        category: "WIFI",
        title: "WiFi drops in room 101",
        description: "Router in 1st floor B-wing keeps disconnecting every 10 minutes. Affecting online classes.",
        photos: JSON.stringify([]),
        priority: "HIGH",
        status: "IN_PROGRESS",
        assignedToId: staffMembers[0].id,
        assignedToName: staffMembers[0].name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "C-2490",
        userId: "u_student_1",
        userName: "Aarav Sharma",
        userRoom: "101 / Block A",
        category: "PLUMBING",
        title: "Leaking tap in common bathroom",
        description: "Cold-water tap on the 2nd floor common bathroom drips constantly.",
        photos: JSON.stringify([]),
        priority: "NORMAL",
        status: "RESOLVED",
        assignedToId: staffMembers[0].id,
        assignedToName: staffMembers[0].name,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        rating: 5,
      },
    ],
  });

  console.log("Complaints seeded successfully!");

  // Seed Fee Invoices (3 Invoices per Student -> July (Pending), June (Paid), May (Paid))
  const roomBasePrices = {
    FOUR_SEATER: 3500,
    THREE_SEATER: 4500,
    TWO_SEATER: 6000,
    SINGLE_SEATER: 8000,
    PVT_DELUXE: 12000,
  };

  const invoices = [];
  students.forEach((st) => {
    const basePrice = roomBasePrices[st.roomType] || 6000;
    const total = basePrice + 1500 + 500; // room + mess + maintenance
    
    const buildComponentsJson = (price) => JSON.stringify([
      { name: `Room (${st.roomType})`, amount: price },
      { name: "Mess charges", amount: 1500 },
      { name: "Maintenance", amount: 500 },
    ]);

    // July 2026: PENDING
    invoices.push({
      id: `inv_2026_07_${st.id}`,
      userId: st.id,
      roomType: st.roomType,
      month: "2026-07",
      components: buildComponentsJson(basePrice),
      total,
      dueDate: "2026-07-15",
      status: "PENDING",
    });

    // June 2026: PAID
    invoices.push({
      id: `inv_2026_06_${st.id}`,
      userId: st.id,
      roomType: st.roomType,
      month: "2026-06",
      components: buildComponentsJson(basePrice),
      total,
      dueDate: "2026-06-10",
      status: "PAID",
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
      transactionId: `txn_inv_2026_06_${st.id}_1715456789000`,
    });

    // May 2026: PAID
    invoices.push({
      id: `inv_2026_05_${st.id}`,
      userId: st.id,
      roomType: st.roomType,
      month: "2026-05",
      components: buildComponentsJson(basePrice),
      total,
      dueDate: "2026-05-10",
      status: "PAID",
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 65),
      transactionId: `txn_inv_2026_05_${st.id}_1715456789000`,
    });
  });

  await prisma.feeInvoice.createMany({
    data: invoices,
  });

  console.log(`${invoices.length} Fee Invoices seeded successfully!`);
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
