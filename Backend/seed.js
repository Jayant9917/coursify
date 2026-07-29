const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const config = require("./config");
const {
  User,
  Category,
  Course,
  CourseSection,
  Lesson,
  Enrollment,
  Order,
  OrderItem,
  Review,
  Wishlist,
  CourseProgress,
  Coupon,
  Notification,
  Note,
} = require("./models");

const DEMO = {
  admin: {
    name: "Coursify Admin",
    email: "admin@coursify.com",
    password: "Admin@123",
    role: "admin",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Coursify%20Admin",
    bio: "Platform administrator for the Coursify demo workspace.",
  },
  instructor: {
    name: "Aarav Mehta",
    email: "instructor@coursify.com",
    password: "Instructor@123",
    role: "instructor",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Aarav%20Mehta",
    bio: "Senior product engineer and instructor focusing on practical web development.",
  },
  instructor2: {
    name: "Maya Patel",
    email: "designer@coursify.com",
    password: "Instructor@123",
    role: "instructor",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Maya%20Patel",
    bio: "Design systems lead teaching product thinking, visual design, and teamwork.",
  },
  student: {
    name: "Priya Sharma",
    email: "student@coursify.com",
    password: "Student@123",
    role: "student",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Priya%20Sharma",
    bio: "Curious learner exploring frontend, backend, and data skills.",
  },
  defaultUser: {
    name: "Default User",
    email: "test@coursify.com",
    password: "Test@1234",
    role: "student",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Default%20User",
    bio: "Default testing account for local development.",
  },
};

const demoCategories = [
  { name: "Web Development", slug: "web-development", sortOrder: 1, isActive: true },
  { name: "Frontend Design", slug: "frontend-design", sortOrder: 2, isActive: true },
  { name: "Backend APIs", slug: "backend-apis", sortOrder: 3, isActive: true },
  { name: "Data Analytics", slug: "data-analytics", sortOrder: 4, isActive: true },
  { name: "Mobile Development", slug: "mobile-development", sortOrder: 5, isActive: true },
  { name: "DevOps & Cloud", slug: "devops-cloud", sortOrder: 6, isActive: true },
  { name: "AI & Machine Learning", slug: "ai-machine-learning", sortOrder: 7, isActive: true },
  { name: "Business & Marketing", slug: "business-marketing", sortOrder: 8, isActive: true },
];

const svgThumbnail = (label, background, foreground) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="${foreground}" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#g)" />
      <circle cx="1080" cy="120" r="180" fill="rgba(255,255,255,0.14)" />
      <circle cx="220" cy="580" r="220" fill="rgba(255,255,255,0.1)" />
      <text x="80" y="610" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700">${label}</text>
    </svg>
  `)}`;

const demoCourses = [
  {
    title: "Modern React from Zero to Production",
    slug: "modern-react-from-zero-to-production",
    categorySlug: "web-development",
    price: 2499,
    discountPrice: 1499,
    level: "beginner",
    language: "en",
    isPublished: true,
    isFeatured: true,
    shortDescription: "Build polished React apps with routing, forms, data fetching, and deployment basics.",
    description: `
      <p>Learn React the practical way by building a polished learning platform UI, step by step.</p>
      <ul>
        <li>Components, props, and state</li>
        <li>Routing and protected pages</li>
        <li>Forms, validation, and API integration</li>
      </ul>
    `,
    thumbnailUrl: svgThumbnail("React", "#0f172a", "#1d4ed8"),
    previewVideoUrl: "",
    tags: ["react", "javascript", "frontend"],
    sections: [
      {
        title: "Getting started",
        lessons: [
          { title: "Course overview", type: "video", content: "Welcome to the course", duration: 8, isPreview: true },
          { title: "Project setup", type: "text", content: "Set up Vite, routing, and Tailwind.", duration: 12, isPreview: true },
        ],
      },
      {
        title: "Build the app",
        lessons: [
          { title: "State and props", type: "video", content: "Work with component state", duration: 20, isPreview: false },
          { title: "Forms and validation", type: "pdf", content: "Downloadable checklist", duration: 15, isPreview: false },
        ],
      },
    ],
  },
  {
    title: "Node.js API Masterclass",
    slug: "nodejs-api-masterclass",
    categorySlug: "backend-apis",
    price: 2999,
    discountPrice: 1999,
    level: "intermediate",
    language: "en",
    isPublished: true,
    isFeatured: true,
    shortDescription: "Design REST APIs with auth, validation, pagination, and clean service layers.",
    description: `
      <p>Build a production-style backend with Express and MongoDB.</p>
      <ul>
        <li>Auth and role-based access</li>
        <li>Controllers, services, and validation</li>
        <li>Paginated queries and error handling</li>
      </ul>
    `,
    thumbnailUrl: svgThumbnail("Node API", "#111827", "#0f766e"),
    previewVideoUrl: "",
    tags: ["node", "express", "mongodb"],
    sections: [
      {
        title: "API fundamentals",
        lessons: [
          { title: "Project architecture", type: "video", content: "Structure backend code cleanly", duration: 10, isPreview: true },
          { title: "Mongo models", type: "text", content: "Design schemas for the domain.", duration: 14, isPreview: true },
        ],
      },
      {
        title: "Production patterns",
        lessons: [
          { title: "Authentication", type: "video", content: "JWT and refresh tokens", duration: 18, isPreview: false },
          { title: "Validation layer", type: "quiz", content: "Check your understanding", duration: 12, isPreview: false },
        ],
      },
    ],
  },
  {
    title: "UI Systems and Product Design",
    slug: "ui-systems-and-product-design",
    categorySlug: "frontend-design",
    price: 1799,
    discountPrice: 999,
    level: "beginner",
    language: "en",
    isPublished: true,
    isFeatured: false,
    shortDescription: "Create consistent interfaces with spacing, typography, and component systems.",
    description: `
      <p>Craft better interfaces by thinking in systems instead of one-off screens.</p>
      <ul>
        <li>Design tokens and spacing rhythm</li>
        <li>Component libraries and reusable patterns</li>
        <li>Responsive layout decisions</li>
      </ul>
    `,
    thumbnailUrl: svgThumbnail("Design", "#1e293b", "#7c3aed"),
    previewVideoUrl: "",
    tags: ["design", "ui", "product"],
    sections: [
      {
        title: "Foundations",
        lessons: [
          { title: "Layout principles", type: "text", content: "A clear layout hierarchy", duration: 11, isPreview: true },
          { title: "Typography rules", type: "video", content: "Selecting fonts and weights", duration: 9, isPreview: true },
        ],
      },
      {
        title: "System building",
        lessons: [
          { title: "Buttons and cards", type: "pdf", content: "Pattern library reference", duration: 13, isPreview: false },
          { title: "Shipping an interface", type: "video", content: "Final polish checklist", duration: 17, isPreview: false },
        ],
      },
    ],
  },
  {
    title: "Data Analytics with Excel and SQL",
    slug: "data-analytics-with-excel-and-sql",
    categorySlug: "data-analytics",
    price: 2199,
    discountPrice: 0,
    level: "intermediate",
    language: "en",
    isPublished: true,
    isFeatured: false,
    shortDescription: "Learn how to turn raw numbers into decisions using spreadsheets and SQL.",
    description: `
      <p>Analyze data with practical techniques used in reporting and business intelligence.</p>
      <ul>
        <li>Cleaning and summarizing data</li>
        <li>Writing SQL queries for analysis</li>
        <li>Building simple dashboards</li>
      </ul>
    `,
    thumbnailUrl: svgThumbnail("Data", "#0f172a", "#ea580c"),
    previewVideoUrl: "",
    tags: ["sql", "excel", "analytics"],
    sections: [
      {
        title: "Data prep",
        lessons: [
          { title: "Spreadsheet cleanup", type: "text", content: "Prepare raw tables for analysis.", duration: 10, isPreview: true },
          { title: "SQL basics", type: "video", content: "SELECT, JOIN, GROUP BY", duration: 15, isPreview: true },
        ],
      },
      {
        title: "Reporting",
        lessons: [
          { title: "Pivot tables", type: "pdf", content: "Reference cheat sheet", duration: 12, isPreview: false },
          { title: "Dashboarding", type: "video", content: "Present findings clearly", duration: 20, isPreview: false },
        ],
      },
    ],
  },
  {
    title: "Advanced Next.js Commerce",
    slug: "advanced-nextjs-commerce",
    categorySlug: "web-development",
    price: 3199,
    discountPrice: 2199,
    level: "advanced",
    language: "en",
    isPublished: true,
    isFeatured: true,
    shortDescription: "Build fast storefronts with server actions, caching, checkout flows, and admin tools.",
    description: `
      <p>Ship a polished commerce experience with a production-minded Next.js architecture.</p>
      <ul>
        <li>App Router and server components</li>
        <li>Cart, checkout, and order management</li>
        <li>Admin dashboards and analytics</li>
      </ul>
    `,
    thumbnailUrl: svgThumbnail("Next.js", "#111827", "#475569"),
    previewVideoUrl: "",
    tags: ["nextjs", "commerce", "react"],
    sections: [
      {
        title: "Storefront",
        lessons: [
          { title: "Routing and layouts", type: "video", content: "Build a fast marketing site.", duration: 12, isPreview: true },
          { title: "Catalog pages", type: "text", content: "Render product and course listings.", duration: 16, isPreview: true },
        ],
      },
      {
        title: "Checkout",
        lessons: [
          { title: "Cart state", type: "video", content: "Persist cart items across sessions.", duration: 18, isPreview: false },
          { title: "Payments", type: "quiz", content: "Handle payment success and errors.", duration: 14, isPreview: false },
        ],
      },
    ],
  },
  {
    title: "TypeScript and Testing for Teams",
    slug: "typescript-and-testing-for-teams",
    categorySlug: "frontend-design",
    price: 1999,
    discountPrice: 1299,
    level: "intermediate",
    language: "en",
    isPublished: true,
    isFeatured: false,
    shortDescription: "Write safer code with TypeScript, component tests, and sensible refactors.",
    description: `
      <p>Learn how to bring type safety and test coverage into a real React codebase.</p>
      <ul>
        <li>Typing props, hooks, and API responses</li>
        <li>Component and integration testing</li>
        <li>Refactoring without fear</li>
      </ul>
    `,
    thumbnailUrl: svgThumbnail("TS", "#0f172a", "#2563eb"),
    previewVideoUrl: "",
    tags: ["typescript", "testing", "react"],
    sections: [
      {
        title: "Type safety",
        lessons: [
          { title: "Typing patterns", type: "video", content: "Avoid implicit any at scale.", duration: 14, isPreview: true },
          { title: "Reusable interfaces", type: "text", content: "Model common UI and API shapes.", duration: 11, isPreview: true },
        ],
      },
      {
        title: "Testing",
        lessons: [
          { title: "React Testing Library", type: "video", content: "Test from the user perspective.", duration: 16, isPreview: false },
          { title: "Mocking requests", type: "pdf", content: "Practical test examples.", duration: 10, isPreview: false },
        ],
      },
    ],
  },
  {
    title: "Docker, CI, and Cloud Deployments",
    slug: "docker-ci-cloud-deployments",
    categorySlug: "devops-cloud",
    price: 2799,
    discountPrice: 1799,
    level: "intermediate",
    language: "en",
    isPublished: true,
    isFeatured: false,
    shortDescription: "Package apps, automate builds, and deploy with confidence.",
    description: `
      <p>Set up the tooling needed to ship a web app with repeatable deployment steps.</p>
      <ul>
        <li>Dockerfiles and compose</li>
        <li>CI pipelines for checks and builds</li>
        <li>Cloud deployment basics</li>
      </ul>
    `,
    thumbnailUrl: svgThumbnail("DevOps", "#0f172a", "#0891b2"),
    previewVideoUrl: "",
    tags: ["docker", "ci", "cloud"],
    sections: [
      {
        title: "Container basics",
        lessons: [
          { title: "Docker images", type: "video", content: "Build and tag images correctly.", duration: 15, isPreview: true },
          { title: "Compose files", type: "text", content: "Run the full stack locally.", duration: 12, isPreview: true },
        ],
      },
      {
        title: "Delivery",
        lessons: [
          { title: "CI pipelines", type: "quiz", content: "Automate checks before shipping.", duration: 14, isPreview: false },
          { title: "Deployments", type: "video", content: "Push to cloud infrastructure.", duration: 20, isPreview: false },
        ],
      },
    ],
  },
  {
    title: "Practical AI Workflows for Builders",
    slug: "practical-ai-workflows-for-builders",
    categorySlug: "ai-machine-learning",
    price: 3499,
    discountPrice: 2499,
    level: "beginner",
    language: "en",
    isPublished: true,
    isFeatured: true,
    shortDescription: "Use AI tools for research, drafting, coding assistance, and product workflows.",
    description: `
      <p>Apply AI to everyday product and engineering tasks with simple, safe patterns.</p>
      <ul>
        <li>Prompt design and iteration</li>
        <li>Workflow automation ideas</li>
        <li>Evaluating outputs and quality</li>
      </ul>
    `,
    thumbnailUrl: svgThumbnail("AI", "#111827", "#7c3aed"),
    previewVideoUrl: "",
    tags: ["ai", "prompting", "automation"],
    sections: [
      {
        title: "Prompting",
        lessons: [
          { title: "Prompt structure", type: "video", content: "Ask for better outputs.", duration: 13, isPreview: true },
          { title: "Evaluation checklist", type: "text", content: "Review answer quality and safety.", duration: 10, isPreview: true },
        ],
      },
      {
        title: "Applied workflows",
        lessons: [
          { title: "Research assistants", type: "pdf", content: "Create reusable prompts.", duration: 11, isPreview: false },
          { title: "Coding helpers", type: "video", content: "Use AI to speed up iteration.", duration: 17, isPreview: false },
        ],
      },
    ],
  },
  {
    title: "Marketing Launch Strategy",
    slug: "marketing-launch-strategy",
    categorySlug: "business-marketing",
    price: 1599,
    discountPrice: 999,
    level: "beginner",
    language: "en",
    isPublished: true,
    isFeatured: false,
    shortDescription: "Plan a launch, write positioning, and measure what matters.",
    description: `
      <p>Turn an idea into a clear market message and launch plan.</p>
      <ul>
        <li>Audience and positioning</li>
        <li>Launch messaging and channels</li>
        <li>Metrics and iteration</li>
      </ul>
    `,
    thumbnailUrl: svgThumbnail("Launch", "#312e81", "#db2777"),
    previewVideoUrl: "",
    tags: ["marketing", "launch", "growth"],
    sections: [
      {
        title: "Positioning",
        lessons: [
          { title: "Audience research", type: "text", content: "Know who you are speaking to.", duration: 10, isPreview: true },
          { title: "Messaging map", type: "video", content: "Structure a crisp launch message.", duration: 12, isPreview: true },
        ],
      },
      {
        title: "Launch execution",
        lessons: [
          { title: "Channel plan", type: "pdf", content: "Pick the right platforms.", duration: 9, isPreview: false },
          { title: "Measure results", type: "quiz", content: "Track key growth signals.", duration: 8, isPreview: false },
        ],
      },
    ],
  },
];

const demoCoupon = { code: "WELCOME10", type: "percent", value: 10, maxRedemptions: 100, isActive: true };

const demoNotes = [
  {
    title: "React Hooks Quick Reference",
    slug: "react-hooks-quick-reference",
    description: "A compact guide to useState, useEffect, custom hooks, and the patterns that keep React code predictable.",
    subject: "Frontend",
    fileKey: "notes/react-hooks-quick-reference.pdf",
    fileName: "react-hooks-quick-reference.pdf",
  },
  {
    title: "SQL Reporting Cheat Sheet",
    slug: "sql-reporting-cheat-sheet",
    description: "Practical SELECT, JOIN, GROUP BY, and window-function examples for everyday analytics work.",
    subject: "Data Analytics",
    fileKey: "notes/sql-reporting-cheat-sheet.pdf",
    fileName: "sql-reporting-cheat-sheet.pdf",
  },
  {
    title: "API Security Checklist",
    slug: "api-security-checklist",
    description: "A production-minded checklist covering authentication, validation, authorization, logging, and webhook safety.",
    subject: "Backend",
    fileKey: "notes/api-security-checklist.pdf",
    fileName: "api-security-checklist.pdf",
  },
];

async function upsertUser(data) {
  const passwordHash = await bcrypt.hash(data.password, config.bcryptSaltRounds);
  return User.findOneAndUpdate(
    { email: data.email.toLowerCase() },
    {
      $set: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
        avatar: data.avatar,
        bio: data.bio,
        status: "active",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertCategory(data) {
  return Category.findOneAndUpdate(
    { slug: data.slug },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertCourse(courseData, instructorId, categoryId) {
  return Course.findOneAndUpdate(
    { slug: courseData.slug },
    {
      $set: {
        title: courseData.title,
        description: courseData.description,
        shortDescription: courseData.shortDescription,
        thumbnailUrl: courseData.thumbnailUrl,
        previewVideoUrl: courseData.previewVideoUrl,
        price: courseData.price,
        discountPrice: courseData.discountPrice,
        level: courseData.level,
        language: courseData.language,
        categoryId,
        instructorId,
        tags: courseData.tags,
        isPublished: courseData.isPublished,
        isFeatured: courseData.isFeatured,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertSection(courseId, sectionData, order) {
  return CourseSection.findOneAndUpdate(
    { courseId, order },
    { $set: { courseId, title: sectionData.title, order } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertLesson(courseId, sectionId, lessonData, order) {
  return Lesson.findOneAndUpdate(
    { courseId, sectionId, order },
    {
      $set: {
        courseId,
        sectionId,
        title: lessonData.title,
        type: lessonData.type,
        content: lessonData.content || "",
        videoUrl: lessonData.videoUrl || "",
        duration: lessonData.duration || 0,
        isPreview: Boolean(lessonData.isPreview),
        order,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function removeExistingItems(orderId) {
  await OrderItem.deleteMany({ orderId });
}

async function main() {
  await mongoose.connect(config.mongoUrl);

  const admin = await upsertUser(DEMO.admin);
  const instructor = await upsertUser(DEMO.instructor);
  const instructor2 = await upsertUser(DEMO.instructor2);
  const student = await upsertUser(DEMO.student);
  await upsertUser(DEMO.defaultUser);

  const categories = new Map();
  for (const category of demoCategories) {
    const doc = await upsertCategory(category);
    categories.set(category.slug, doc);
  }

  const courses = new Map();
  for (const courseData of demoCourses) {
    const courseInstructor = courseData.categorySlug === "frontend-design" || courseData.categorySlug === "business-marketing"
      ? instructor2
      : instructor;
    const course = await upsertCourse(courseData, courseInstructor._id, categories.get(courseData.categorySlug)._id);
    courses.set(courseData.slug, course);

    await CourseSection.deleteMany({ courseId: course._id });
    await Lesson.deleteMany({ courseId: course._id });

    for (let sectionIndex = 0; sectionIndex < courseData.sections.length; sectionIndex += 1) {
      const sectionData = courseData.sections[sectionIndex];
      const section = await upsertSection(course._id, sectionData, sectionIndex + 1);
      for (let lessonIndex = 0; lessonIndex < sectionData.lessons.length; lessonIndex += 1) {
        await upsertLesson(course._id, section._id, sectionData.lessons[lessonIndex], lessonIndex + 1);
      }
    }
  }

  for (const noteData of demoNotes) {
    await Note.findOneAndUpdate(
      { slug: noteData.slug },
      {
        $set: {
          ...noteData,
          sellerId: instructor._id,
          price: 0,
          currency: "INR",
          contentType: "application/pdf",
          isPublished: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  await Coupon.findOneAndUpdate(
    { code: demoCoupon.code },
    { $set: demoCoupon },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const selectedCourseIds = [
    courses.get("modern-react-from-zero-to-production")._id,
    courses.get("nodejs-api-masterclass")._id,
  ];
  const selectedCourses = await Course.find({ _id: { $in: selectedCourseIds } });
  const subtotal = selectedCourses.reduce((sum, course) => {
    const price = course.discountPrice && course.discountPrice > 0 ? course.discountPrice : course.price;
    return sum + price;
  }, 0);
  const discount = Math.round((subtotal * demoCoupon.value) / 100);
  const orderAmount = Math.max(subtotal - discount, 0);

  const order = await Order.findOneAndUpdate(
    { userId: student._id, paymentIntentId: "seed-demo-order-001" },
    {
      $set: {
        userId: student._id,
        amount: orderAmount,
        currency: "INR",
        status: "paid",
        paymentProvider: "manual",
        paymentIntentId: "seed-demo-order-001",
        couponCode: demoCoupon.code,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await removeExistingItems(order._id);
  await OrderItem.insertMany(
    selectedCourses.map((course) => ({
      orderId: order._id,
      courseId: course._id,
      priceAtPurchase: course.discountPrice && course.discountPrice > 0 ? course.discountPrice : course.price,
    }))
  );

  const enrollmentCourseIds = [
    courses.get("modern-react-from-zero-to-production")._id,
    courses.get("nodejs-api-masterclass")._id,
  ];

  for (let i = 0; i < enrollmentCourseIds.length; i += 1) {
    const courseId = enrollmentCourseIds[i];
    await Enrollment.findOneAndUpdate(
      { userId: student._id, courseId },
      {
        $set: {
          userId: student._id,
          courseId,
          status: i === 0 ? "active" : "completed",
          progressPercent: i === 0 ? 45 : 100,
          lastViewedLessonId: null,
          completedLessonIds: [],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  const firstCourse = courses.get("modern-react-from-zero-to-production");
  const firstLessons = await Lesson.find({ courseId: firstCourse._id }).sort({ order: 1 });

  await Review.findOneAndUpdate(
    { userId: student._id, courseId: firstCourse._id },
    {
      $set: {
        userId: student._id,
        courseId: firstCourse._id,
        rating: 5,
        title: "Great practical course",
        comment: "The demo covers routing, forms, and dashboard patterns clearly.",
        isVerifiedPurchase: true,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Wishlist.findOneAndUpdate(
    { userId: student._id, courseId: courses.get("ui-systems-and-product-design")._id },
    { $setOnInsert: { userId: student._id, courseId: courses.get("ui-systems-and-product-design")._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (firstLessons.length > 0) {
    await CourseProgress.findOneAndUpdate(
      { userId: student._id, courseId: firstCourse._id, lessonId: firstLessons[0]._id },
      {
        $set: {
          userId: student._id,
          courseId: firstCourse._id,
          lessonId: firstLessons[0]._id,
          watchedSeconds: 120,
          isCompleted: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  await Notification.findOneAndUpdate(
    { userId: student._id, type: "course", title: "Welcome to Coursify" },
    {
      $set: {
        userId: student._id,
        type: "course",
        title: "Welcome to Coursify",
        message: "Your demo account is ready with enrolled courses and a sample order.",
        read: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Notification.findOneAndUpdate(
    { userId: instructor._id, type: "course", title: "Demo courses published" },
    {
      $set: {
        userId: instructor._id,
        type: "course",
        title: "Demo courses published",
        message: "Seed data created sample courses, sections, and lessons for the dashboard.",
        read: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Notification.findOneAndUpdate(
    { userId: instructor2._id, type: "course", title: "Design courses published" },
    {
      $set: {
        userId: instructor2._id,
        type: "course",
        title: "Design courses published",
        message: "Additional demo courses were created for the visual design and business tracks.",
        read: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Notification.findOneAndUpdate(
    { userId: admin._id, type: "system", title: "Seed completed" },
    {
      $set: {
        userId: admin._id,
        type: "system",
        title: "Seed completed",
        message: "Demo users, categories, courses, and sample commerce data were created successfully.",
        read: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const summary = {
    users: {
      admin: DEMO.admin.email,
      instructor: DEMO.instructor.email,
      instructor2: DEMO.instructor2.email,
      student: DEMO.student.email,
      defaultUser: DEMO.defaultUser.email,
    },
    coupon: demoCoupon.code,
    notes: demoNotes.map((note) => note.slug),
    courses: Array.from(courses.values()).map((course) => course.slug),
  };

  console.log("Seed completed successfully");
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
