import {
  documentBundle,
  type Blueprint,
} from "../supabase/functions/_shared/domain.ts";
export function fixture() {
  const b: Blueprint = {
    product: {
      name: "Test fixture",
      mission: "A test-only product specification.",
      audience: "Fixture users",
      wedge: "Fixture wedge",
      scope: ["Track a habit"],
      non_goals: ["Social network"],
      monetization: "No payments in the fixture.",
      architecture:
        "Flutter with a local SQLite habit table containing an ID, label, created_at and completion_date. A repository validates inputs, writes atomically and exposes streams to the presentation layer. No external integrations.",
      security:
        "No authentication or remote server in this fixture. Data remains in the app sandbox. Input is validated and user-generated content is never executed. Export requires explicit user interaction and logs exclude user content.",
      analytics:
        "No analytics collection. Local completion totals are computed on device and are never transmitted.",
      launch: "Run fixture acceptance tests before release.",
    },
    requirements: [
      {
        stable_key: "REQ-001",
        title: "Track a habit",
        requirement_text: "Record a daily completion.",
        rationale: "Core fixture behavior",
        priority: "MVP",
        acceptance_criteria: ["Completion is persisted exactly once per day"],
        trace: { notes: "Test fixture", references: [] },
      },
    ],
    features: [
      {
        stable_key: "FEAT-001",
        name: "Completion",
        outcome: "A habit is tracked",
        description: "Record completion locally.",
        priority: "MVP",
        data: { notes: "Habits table", references: [] },
      },
    ],
    rules: [
      {
        stable_key: "RULE-001",
        name: "Unique completion",
        condition_text: "A habit is complete today",
        behavior_text: "Prevent duplicate completion",
        exceptions: [],
        data: { notes: "Fixture data", references: [] },
      },
    ],
    screens: [
      {
        stable_key: "SCR-001",
        name: "Home",
        purpose: "View habits",
        entry_points: ["Launch"],
        components: [
          { type: "button", text: "Create habit", target: "SCR-002" },
        ],
        states: {
          default: "List",
          loading: "Progress",
          empty: "Create your first habit",
          error: "Retry",
          offline: "Local data available",
          permission: "No permissions required",
          partial: "Display saved habits",
        },
        actions: ["Create habit"],
        navigation: ["SCR-002"],
        data: { notes: "Fixture data", references: [] },
      },
      {
        stable_key: "SCR-002",
        name: "Create",
        purpose: "Add a habit",
        entry_points: ["SCR-001"],
        components: [
          { type: "input", text: "Habit name", target: null },
          { type: "button", text: "Save", target: "SCR-001" },
        ],
        states: {
          default: "Form",
          loading: "Saving",
          empty: "Enter name",
          error: "Retry",
          offline: "Local save available",
          permission: "No permissions required",
          partial: "Preserve entered values",
        },
        actions: ["Save"],
        navigation: ["SCR-001"],
        data: { notes: "Fixture data", references: [] },
      },
    ],
    flows: [
      {
        stable_key: "FLOW-001",
        name: "Add habit",
        trigger_text: "Create habit",
        preconditions: [],
        steps: ["SCR-001", "SCR-002", "SCR-001"],
        completion_text: "Habit visible",
        data: { notes: "Fixture data", references: [] },
      },
    ],
    decisions: [
      {
        stable_key: "DEC-001",
        decision_text: "Use local storage",
        rationale: "Offline fixture",
        alternatives: ["Remote service"],
        consequences: ["No sync"],
        research_trace: { notes: "Explicit fixture decision", references: [] },
      },
    ],
    tasks: [
      {
        stable_key: "TASK-001",
        title: "Implement completion",
        objective: "Persist completion locally",
        dependencies: [],
        implements: ["REQ-001", "FEAT-001", "SCR-001"],
        guidance: "Use a transaction and unique constraint.",
        test_obligations: ["Run TEST-001"],
        definition_of_done: ["Tests pass"],
        sequence: 1,
      },
    ],
    tests: [
      {
        stable_key: "TEST-001",
        title: "Completion persistence",
        test_type: "integration",
        validates: ["REQ-001", "RULE-001"],
        steps: ["Complete a habit", "Reopen the app", "Complete it again"],
        expected_result: "One completion persists",
      },
    ],
    links: [
      {
        source_kind: "requirement",
        source_key: "REQ-001",
        target_kind: "feature",
        target_key: "FEAT-001",
        relation: "implemented_by",
      },
      {
        source_kind: "feature",
        source_key: "FEAT-001",
        target_kind: "screen",
        target_key: "SCR-001",
        relation: "shown_on",
      },
      {
        source_kind: "feature",
        source_key: "FEAT-001",
        target_kind: "screen",
        target_key: "SCR-002",
        relation: "shown_on",
      },
    ],
  };
  return documentBundle(b, { type: "test_fixture", not_market_evidence: true });
}
