import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const directoryGroups = sqliteTable(
  "directory_groups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    zone: text("zone").notNull(),
    name: text("name").notNull(),
    city: text("city").notNull().default(""),
    leaderName: text("leader_name").notNull().default(""),
    subleaderName: text("subleader_name").notNull().default(""),
    whatsapp: text("whatsapp").notNull().default(""),
    email: text("email").notNull().default(""),
    facebook: text("facebook").notNull().default(""),
    address: text("address").notNull().default(""),
    mapsUrl: text("maps_url").notNull().default(""),
    schedules: text("schedules").notNull().default(""),
    sessionTypes: text("session_types").notNull().default(""),
    status: text("status").notNull().default("active"),
    version: integer("version").notNull().default(1),
    verifiedAt: text("verified_at"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedBy: text("updated_by").notNull().default("system"),
  },
  (table) => [
    uniqueIndex("directory_groups_zone_name_city_idx").on(
      table.zone,
      table.name,
      table.city,
    ),
  ],
);

export const rehabilitationCenters = sqliteTable(
  "rehabilitation_centers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    network: text("network").notNull().default("Red Teocalli"),
    state: text("state").notNull().default(""),
    city: text("city").notNull().default(""),
    address: text("address").notNull().default(""),
    responsibleName: text("responsible_name").notNull().default(""),
    phone: text("phone").notNull().default(""),
    whatsapp: text("whatsapp").notNull().default(""),
    email: text("email").notNull().default(""),
    website: text("website").notNull().default(""),
    mapsUrl: text("maps_url").notNull().default(""),
    description: text("description").notNull().default(""),
    services: text("services").notNull().default(""),
    status: text("status").notNull().default("published"),
    version: integer("version").notNull().default(1),
    verifiedAt: text("verified_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedBy: text("updated_by").notNull().default("system"),
  },
  (table) => [
    uniqueIndex("rehabilitation_centers_name_city_idx").on(
      table.name,
      table.city,
    ),
    index("rehabilitation_centers_public_idx").on(
      table.status,
      table.state,
      table.city,
    ),
  ],
);

export const portalUsers = sqliteTable("portal_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  role: text("role").notNull(),
  roleLabel: text("role_label").notNull().default(""),
  zone: text("zone"),
  groupId: integer("group_id").references(() => directoryGroups.id),
  centerId: integer("center_id").references(() => rehabilitationCenters.id),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  notes: text("notes").notNull().default(""),
  source: text("source").notNull().default("manual"),
  createdBy: text("created_by"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const centerRequests = sqliteTable(
  "center_requests",
  {
    id: text("id").primaryKey(),
    requestType: text("request_type").notNull(),
    centerId: integer("center_id").references(() => rehabilitationCenters.id),
    centerVersion: integer("center_version"),
    requesterEmail: text("requester_email").notNull(),
    requesterName: text("requester_name").notNull(),
    requesterPhone: text("requester_phone").notNull().default(""),
    proposedJson: text("proposed_json").notNull(),
    originalJson: text("original_json").notNull().default("{}"),
    requesterNote: text("requester_note").notNull().default(""),
    status: text("status").notNull().default("pending"),
    reviewerEmail: text("reviewer_email"),
    reviewNote: text("review_note").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    reviewedAt: text("reviewed_at"),
  },
  (table) => [
    index("center_requests_status_idx").on(table.status, table.createdAt),
    index("center_requests_requester_idx").on(
      table.requesterEmail,
      table.createdAt,
    ),
    index("center_requests_center_idx").on(table.centerId, table.createdAt),
  ],
);

export const centerDirectors = sqliteTable(
  "center_directors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    centerId: integer("center_id")
      .notNull()
      .references(() => rehabilitationCenters.id),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    phone: text("phone").notNull().default(""),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    approvedBy: text("approved_by").notNull(),
    approvedAt: text("approved_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("center_directors_center_email_idx").on(
      table.centerId,
      table.email,
    ),
    index("center_directors_email_idx").on(table.email, table.active),
  ],
);

export const orientationRequests = sqliteTable(
  "orientation_requests",
  {
    id: text("id").primaryKey(),
    requesterName: text("requester_name").notNull(),
    whatsapp: text("whatsapp").notNull(),
    city: text("city").notNull().default(""),
    relationship: text("relationship").notNull().default(""),
    ageGroup: text("age_group").notNull().default("unknown"),
    helpType: text("help_type").notNull().default("unsure"),
    danger: text("danger").notNull().default("unsure"),
    preferredTime: text("preferred_time").notNull().default(""),
    consentContact: integer("consent_contact", { mode: "boolean" })
      .notNull()
      .default(false),
    consentPrivacy: integer("consent_privacy", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status").notNull().default("new"),
    assignedCenterId: integer("assigned_center_id").references(
      () => rehabilitationCenters.id,
    ),
    adminNotes: text("admin_notes").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedBy: text("updated_by").notNull().default("system"),
  },
  (table) => [
    index("orientation_requests_status_idx").on(table.status, table.createdAt),
    index("orientation_requests_center_idx").on(
      table.assignedCenterId,
      table.createdAt,
    ),
  ],
);

export const accessRequests = sqliteTable("access_requests", {
  id: text("id").primaryKey(),
  requesterEmail: text("requester_email").notNull(),
  requesterName: text("requester_name").notNull(),
  phone: text("phone").notNull().default(""),
  requestedRole: text("requested_role").notNull(),
  requestedRoleLabel: text("requested_role_label").notNull().default(""),
  zone: text("zone"),
  groupId: integer("group_id").references(() => directoryGroups.id),
  groupName: text("group_name").notNull().default(""),
  reason: text("reason").notNull().default(""),
  status: text("status").notNull().default("pending"),
  reviewerEmail: text("reviewer_email"),
  reviewNote: text("review_note").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: text("reviewed_at"),
  archivedAt: text("archived_at"),
});

export const accessRequestEvents = sqliteTable(
  "access_request_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    requestId: text("request_id")
      .notNull()
      .references(() => accessRequests.id),
    actorEmail: text("actor_email").notNull(),
    eventType: text("event_type").notNull(),
    note: text("note").notNull().default(""),
    snapshotJson: text("snapshot_json").notNull().default("{}"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("access_request_events_request_idx").on(
      table.requestId,
      table.createdAt,
    ),
  ],
);

export const directoryChangeRequests = sqliteTable(
  "directory_change_requests",
  {
    id: text("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => directoryGroups.id),
    groupVersion: integer("group_version").notNull(),
    requesterEmail: text("requester_email").notNull(),
    requesterName: text("requester_name").notNull(),
    requesterRole: text("requester_role").notNull(),
    status: text("status").notNull().default("pending"),
    originalJson: text("original_json").notNull(),
    proposedJson: text("proposed_json").notNull(),
    requesterNote: text("requester_note").notNull().default(""),
    reviewerEmail: text("reviewer_email"),
    reviewNote: text("review_note").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    reviewedAt: text("reviewed_at"),
    archivedAt: text("archived_at"),
  },
);

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  detailsJson: text("details_json").notNull().default("{}"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const contentSettings = sqliteTable("content_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const testimonyTopics = sqliteTable(
  "testimony_topics",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    category: text("category").notNull().default("General"),
    intensity: text("intensity").notNull().default("Media"),
    moment: text("moment").notNull().default("Mitad"),
    objective: text("objective").notNull().default(""),
    anchor: text("anchor").notNull().default(""),
    payloadJson: text("payload_json").notNull().default("{}"),
    fileKey: text("file_key"),
    fileName: text("file_name").notNull().default(""),
    fileType: text("file_type").notNull().default(""),
    fileSize: integer("file_size").notNull().default(0),
    status: text("status").notNull().default("published"),
    origin: text("origin").notNull().default("upload"),
    createdBy: text("created_by").notNull().default("system"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("testimony_topics_status_idx").on(table.status, table.category),
  ],
);

export const leaderMaterials = sqliteTable(
  "leader_materials",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    category: text("category").notNull().default("otros"),
    description: text("description").notNull().default(""),
    versionLabel: text("version_label").notNull().default(""),
    fileKey: text("file_key"),
    staticUrl: text("static_url"),
    previewUrl: text("preview_url"),
    fileName: text("file_name").notNull().default(""),
    fileType: text("file_type").notNull().default(""),
    fileSize: integer("file_size").notNull().default(0),
    status: text("status").notNull().default("published"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: text("created_by").notNull().default("system"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("leader_materials_status_idx").on(
      table.status,
      table.category,
      table.sortOrder,
    ),
  ],
);

export const announcements = sqliteTable(
  "announcements",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull(),
    priority: text("priority").notNull().default("info"),
    audience: text("audience").notNull().default("all"),
    status: text("status").notNull().default("draft"),
    revision: integer("revision").notNull().default(1),
    createdBy: text("created_by").notNull(),
    publishedAt: text("published_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("announcements_status_idx").on(table.status, table.publishedAt),
  ],
);

export const announcementReads = sqliteTable(
  "announcement_reads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    announcementId: text("announcement_id")
      .notNull()
      .references(() => announcements.id),
    userEmail: text("user_email").notNull(),
    revision: integer("revision").notNull().default(1),
    readAt: text("read_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("announcement_reads_user_idx").on(
      table.announcementId,
      table.userEmail,
    ),
  ],
);

export const adminInboxReads = sqliteTable(
  "admin_inbox_reads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemKey: text("item_key").notNull(),
    userEmail: text("user_email").notNull(),
    sourceUpdatedAt: text("source_updated_at").notNull(),
    readAt: text("read_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("admin_inbox_reads_item_user_idx").on(
      table.itemKey,
      table.userEmail,
    ),
  ],
);

export const monthlyExperiences = sqliteTable(
  "monthly_experiences",
  {
    id: text("id").primaryKey(),
    month: text("month").notNull(),
    zone: text("zone").notNull(),
    title: text("title").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    location: text("location").notNull().default(""),
    writingsJson: text("writings_json").notNull().default("[]"),
    notes: text("notes").notNull().default(""),
    status: text("status").notNull().default("published"),
    createdBy: text("created_by").notNull().default("system"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("monthly_experiences_month_idx").on(
      table.month,
      table.status,
      table.zone,
    ),
  ],
);

export const groupRegistrationRequests = sqliteTable(
  "group_registration_requests",
  {
    id: text("id").primaryKey(),
    requesterEmail: text("requester_email").notNull(),
    requesterName: text("requester_name").notNull().default(""),
    requesterRole: text("requester_role").notNull(),
    zone: text("zone").notNull(),
    proposedJson: text("proposed_json").notNull(),
    requesterNote: text("requester_note").notNull().default(""),
    status: text("status").notNull().default("pending"),
    reviewerEmail: text("reviewer_email"),
    reviewNote: text("review_note").notNull().default(""),
    createdGroupId: integer("created_group_id").references(
      () => directoryGroups.id,
    ),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    reviewedAt: text("reviewed_at"),
  },
  (table) => [
    index("group_registration_status_idx").on(
      table.status,
      table.zone,
      table.createdAt,
    ),
    index("group_registration_requester_idx").on(
      table.requesterEmail,
      table.createdAt,
    ),
  ],
);

export const ethicsReports = sqliteTable(
  "ethics_reports",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publicFolio: text("public_folio").notNull(),
    trackingSecretHash: text("tracking_secret_hash").notNull(),
    category: text("category").notNull(),
    groupZone: text("group_zone").notNull().default(""),
    approximateDate: text("approximate_date").notNull().default(""),
    narrative: text("narrative").notNull(),
    peopleOrWitnesses: text("people_or_witnesses").notNull().default(""),
    supportNeeded: text("support_needed").notNull(),
    contactMethod: text("contact_method").notNull().default("none"),
    safeContact: text("safe_contact").notNull().default(""),
    consent: integer("consent", { mode: "boolean" }).notNull(),
    status: text("status").notNull().default("received"),
    severity: text("severity").notNull().default("unclassified"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("ethics_reports_public_folio_idx").on(table.publicFolio),
    uniqueIndex("ethics_reports_tracking_secret_idx").on(table.trackingSecretHash),
    index("ethics_reports_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const ethicsReportEvents = sqliteTable(
  "ethics_report_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reportId: integer("report_id").notNull().references(() => ethicsReports.id),
    eventType: text("event_type").notNull(),
    status: text("status").notNull(),
    publicMessage: text("public_message").notNull().default(""),
    privateNote: text("private_note").notNull().default(""),
    actorEmail: text("actor_email").notNull().default("system"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("ethics_report_events_report_idx").on(table.reportId, table.createdAt),
  ],
);

export const leaderReports = sqliteTable(
  "leader_reports",
  {
    id: text("id").primaryKey(),
    reporterEmail: text("reporter_email").notNull(),
    reporterName: text("reporter_name").notNull().default(""),
    reporterRole: text("reporter_role").notNull().default(""),
    phone: text("phone").notNull().default(""),
    category: text("category").notNull(),
    groupZone: text("group_zone").notNull().default(""),
    approximateDate: text("approximate_date").notNull().default(""),
    narrative: text("narrative").notNull(),
    peopleOrWitnesses: text("people_or_witnesses").notNull().default(""),
    supportNeeded: text("support_needed").notNull(),
    status: text("status").notNull().default("received"),
    adminNotes: text("admin_notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
  },
  (table) => [
    index("leader_reports_status_created_idx").on(table.status, table.createdAt),
    index("leader_reports_reporter_idx").on(table.reporterEmail, table.createdAt),
  ],
);

export const universityUsers = sqliteTable(
  "university_users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    mobilePhone: text("mobile_phone").notNull().default(""),
    organization: text("organization").notNull().default(""),
    participantType: text("participant_type").notNull().default("participant"),
    diplomaVersion: text("diploma_version").notNull().default("2022"),
    status: text("status").notNull().default("active"),
    source: text("source").notNull().default("self_registration"),
    requestNotes: text("request_notes").notNull().default(""),
    designCompleted: integer("design_completed", { mode: "boolean" }).notNull().default(false),
    sentToContact: integer("sent_to_contact", { mode: "boolean" }).notNull().default(false),
    createdBy: text("created_by").notNull().default("public-form"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("university_users_email_idx").on(table.email),
    index("university_users_status_version_idx").on(table.status, table.diplomaVersion),
  ],
);

export const universityCenterBatches = sqliteTable(
  "university_center_batches",
  {
    id: text("id").primaryKey(),
    directorEmail: text("director_email").notNull(),
    mobilePhone: text("mobile_phone").notNull(),
    centerName: text("center_name").notNull(),
    diplomaVersion: text("diploma_version").notNull(),
    participantNamesJson: text("participant_names_json").notNull().default("[]"),
    participantCount: integer("participant_count").notNull().default(0),
    requestNotes: text("request_notes").notNull().default(""),
    designCompleted: integer("design_completed", { mode: "boolean" }).notNull().default(false),
    sentToContact: integer("sent_to_contact", { mode: "boolean" }).notNull().default(false),
    status: text("status").notNull().default("received"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("university_center_batches_status_idx").on(table.status, table.createdAt)],
);

export const universityCertificateRequests = sqliteTable(
  "university_certificate_requests",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    mobilePhone: text("mobile_phone").notNull(),
    groupName: text("group_name").notNull(),
    diplomaVersion: text("diploma_version").notNull(),
    paymentStatus: text("payment_status").notNull(),
    tasksStatus: text("tasks_status").notNull().default("pending"),
    requestType: text("request_type").notNull().default("printing"),
    requestNotes: text("request_notes").notNull().default(""),
    email: text("email").notNull().default(""),
    designCompleted: integer("design_completed", { mode: "boolean" }).notNull().default(false),
    sentToContact: integer("sent_to_contact", { mode: "boolean" }).notNull().default(false),
    status: text("status").notNull().default("pending_validation"),
    adminNotes: text("admin_notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedBy: text("updated_by").notNull().default("system"),
  },
  (table) => [index("university_certificate_requests_status_idx").on(table.status, table.createdAt)],
);

export const universityRecognitions = sqliteTable(
  "university_recognitions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    folio: text("folio").notNull(),
    sequence: integer("sequence").notNull(),
    program: text("program").notNull(),
    year: integer("year").notNull(),
    fullName: text("full_name").notNull(),
    conocerFolio: text("conocer_folio").notNull().default(""),
    sentAt: text("sent_at"),
    printedAt: text("printed_at"),
    deliveredAt: text("delivered_at"),
    archivedAt: text("archived_at"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("university_recognitions_folio_idx").on(table.folio),
    uniqueIndex("university_recognitions_year_sequence_idx").on(table.year, table.sequence),
    index("university_recognitions_program_year_idx").on(table.program, table.year),
  ],
);

export const universityPrograms = sqliteTable(
  "university_programs",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    generation: text("generation").notNull().default(""),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("published"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: text("created_by").notNull().default("system"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("university_programs_status_order_idx").on(table.status, table.sortOrder)],
);

export const universityModules = sqliteTable(
  "university_modules",
  {
    id: text("id").primaryKey(),
    programId: text("program_id").notNull().references(() => universityPrograms.id),
    title: text("title").notNull(),
    videoUrl: text("video_url").notNull().default(""),
    status: text("status").notNull().default("published"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: text("created_by").notNull().default("system"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("university_modules_program_order_idx").on(table.programId, table.status, table.sortOrder)],
);

export const universityMaterials = sqliteTable(
  "university_materials",
  {
    id: text("id").primaryKey(),
    programId: text("program_id").references(() => universityPrograms.id),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    resourceUrl: text("resource_url").notNull(),
    resourceType: text("resource_type").notNull().default("material"),
    status: text("status").notNull().default("published"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: text("created_by").notNull().default("system"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("university_materials_program_order_idx").on(table.programId, table.status, table.sortOrder)],
);
export const distributionWorkspaces = sqliteTable("distribution_workspaces", {
  ownerEmail: text("owner_email").primaryKey().notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
  revision: integer("revision").notNull().default(1),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Overrides for bundled brand resources and metadata for administrator uploads.
export const brandResources = sqliteTable("brand_resources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  staticUrl: text("static_url"),
  fileKey: text("file_key"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  deleted: integer("deleted").notNull().default(0),
  revision: integer("revision").notNull().default(1),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const ackDocuments = sqliteTable("ack_documents", {
  id: text("id").primaryKey(), title: text("title").notNull(), zone: text("zone").notNull(),
  category: text("category").notNull(), meetingDate: text("meeting_date").notNull(),
  status: text("status").notNull().default("draft"), latestVersionId: text("latest_version_id"),
  createdAt: text("created_at").notNull(), createdBy: text("created_by").notNull(),
});
export const ackVersions = sqliteTable("ack_versions", {
  id: text("id").primaryKey(), documentId: text("document_id").notNull().references(()=>ackDocuments.id),
  version: text("version").notNull(), title: text("title").notNull(), zone: text("zone").notNull(),
  category: text("category").notNull(), meetingDate: text("meeting_date").notNull(), content: text("content").notNull(),
  status: text("status").notNull().default("draft"), publishedAt: text("published_at"), dueAt: text("due_at"),
  requiresNew: integer("requires_new").notNull().default(1), createdBy: text("created_by").notNull(),
}, t=>[uniqueIndex("ack_version_number_idx").on(t.documentId,t.version)]);
export const ackAssignments = sqliteTable("ack_assignments", {
  id: text("id").primaryKey(), versionId: text("version_id").notNull().references(()=>ackVersions.id),
  userEmail: text("user_email").notNull(), userId: text("user_id").notNull(),
  fullName: text("full_name").notNull(), groupName: text("group_name").notNull(), serviceRole: text("service_role").notNull(), zone: text("zone").notNull(),
  assignedAt: text("assigned_at").notNull(), openedAt: text("opened_at"), progress: integer("progress").notNull().default(0),
  followUp: text("follow_up").notNull().default(""), carriedFrom: text("carried_from"),
},t=>[uniqueIndex("ack_assignment_user_idx").on(t.versionId,t.userEmail),index("ack_assignment_email_idx").on(t.userEmail)]);
export const acknowledgements = sqliteTable("acknowledgements", {
  id: integer("id").primaryKey({autoIncrement:true}), assignmentId: text("assignment_id").notNull().references(()=>ackAssignments.id),
  folio: text("folio").notNull(), userId: text("user_id").notNull(), fullName: text("full_name").notNull(), groupName: text("group_name").notNull(),
  serviceRole: text("service_role").notNull(), zone: text("zone").notNull(), signatureKey: text("signature_key").notNull(),
  confirmedAt: text("confirmed_at").notNull(), statement: text("statement").notNull(),
},t=>[uniqueIndex("ack_receipt_assignment_idx").on(t.assignmentId),uniqueIndex("ack_receipt_folio_idx").on(t.folio)]);
