export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_invocations: {
        Row: {
          change_request_id: string | null
          cost_usd: number
          created_at: string
          error_code: string | null
          external_request_id: string | null
          id: string
          input_checksum: string | null
          input_tokens: number | null
          latency_ms: number | null
          output_checksum: string | null
          output_tokens: number | null
          owner_id: string
          project_id: string | null
          prompt_version_id: string | null
          provider: string | null
          requested_model: string | null
          research_job_id: string | null
          research_run_id: string | null
          resolved_model: string | null
          retry_count: number
          role_key: string
          schema_checksum: string | null
          schema_version: string | null
          status: string
        }
        Insert: {
          change_request_id?: string | null
          cost_usd?: number
          created_at?: string
          error_code?: string | null
          external_request_id?: string | null
          id?: string
          input_checksum?: string | null
          input_tokens?: number | null
          latency_ms?: number | null
          output_checksum?: string | null
          output_tokens?: number | null
          owner_id: string
          project_id?: string | null
          prompt_version_id?: string | null
          provider?: string | null
          requested_model?: string | null
          research_job_id?: string | null
          research_run_id?: string | null
          resolved_model?: string | null
          retry_count?: number
          role_key: string
          schema_checksum?: string | null
          schema_version?: string | null
          status: string
        }
        Update: {
          change_request_id?: string | null
          cost_usd?: number
          created_at?: string
          error_code?: string | null
          external_request_id?: string | null
          id?: string
          input_checksum?: string | null
          input_tokens?: number | null
          latency_ms?: number | null
          output_checksum?: string | null
          output_tokens?: number | null
          owner_id?: string
          project_id?: string | null
          prompt_version_id?: string | null
          provider?: string | null
          requested_model?: string | null
          research_job_id?: string | null
          research_run_id?: string | null
          resolved_model?: string | null
          retry_count?: number
          role_key?: string
          schema_checksum?: string | null
          schema_version?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_invocations_change_request_fk"
            columns: ["change_request_id"]
            isOneToOne: false
            referencedRelation: "change_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_invocations_project_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_invocations_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_invocations_research_job_id_fkey"
            columns: ["research_job_id"]
            isOneToOne: false
            referencedRelation: "research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_invocations_research_run_id_fkey"
            columns: ["research_run_id"]
            isOneToOne: false
            referencedRelation: "research_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_roles: {
        Row: {
          active_prompt_version_id: string | null
          active_schema_version: string | null
          created_at: string
          enabled: boolean
          fallback_models: Json
          id: string
          max_cost_per_call_usd: number | null
          owner_id: string
          primary_model: string | null
          provider_preferences: Json
          role_key: string
          settings: Json
          updated_at: string
        }
        Insert: {
          active_prompt_version_id?: string | null
          active_schema_version?: string | null
          created_at?: string
          enabled?: boolean
          fallback_models?: Json
          id?: string
          max_cost_per_call_usd?: number | null
          owner_id: string
          primary_model?: string | null
          provider_preferences?: Json
          role_key: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          active_prompt_version_id?: string | null
          active_schema_version?: string | null
          created_at?: string
          enabled?: boolean
          fallback_models?: Json
          id?: string
          max_cost_per_call_usd?: number | null
          owner_id?: string
          primary_model?: string | null
          provider_preferences?: Json
          role_key?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_roles_prompt_fk"
            columns: ["active_prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          apps_allocation: number
          daily_ai_budget_usd: number
          daily_research_enabled: boolean
          daily_research_local_time: string
          dedupe_policy: Json
          development_profile: Json
          games_allocation: number
          idea_of_day_min_confidence: number
          idea_of_day_min_score: number
          max_deep_candidates: number
          monthly_ai_budget_usd: number
          owner_id: string
          research_config: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          apps_allocation?: number
          daily_ai_budget_usd?: number
          daily_research_enabled?: boolean
          daily_research_local_time?: string
          dedupe_policy?: Json
          development_profile?: Json
          games_allocation?: number
          idea_of_day_min_confidence?: number
          idea_of_day_min_score?: number
          max_deep_candidates?: number
          monthly_ai_budget_usd?: number
          owner_id: string
          research_config?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          apps_allocation?: number
          daily_ai_budget_usd?: number
          daily_research_enabled?: boolean
          daily_research_local_time?: string
          dedupe_policy?: Json
          development_profile?: Json
          games_allocation?: number
          idea_of_day_min_confidence?: number
          idea_of_day_min_score?: number
          max_deep_candidates?: number
          monthly_ai_budget_usd?: number
          owner_id?: string
          research_config?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      blueprint_decisions: {
        Row: {
          alternatives: Json
          blueprint_version_id: string
          consequences: Json
          created_at: string
          decision_text: string
          id: string
          owner_id: string
          rationale: string
          research_trace: Json
          stable_key: string
        }
        Insert: {
          alternatives?: Json
          blueprint_version_id: string
          consequences?: Json
          created_at?: string
          decision_text: string
          id?: string
          owner_id: string
          rationale: string
          research_trace?: Json
          stable_key: string
        }
        Update: {
          alternatives?: Json
          blueprint_version_id?: string
          consequences?: Json
          created_at?: string
          decision_text?: string
          id?: string
          owner_id?: string
          rationale?: string
          research_trace?: Json
          stable_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_decisions_blueprint_version_id_fkey"
            columns: ["blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_documents: {
        Row: {
          blueprint_version_id: string
          checksum: string | null
          content_md: string
          created_at: string
          document_type: string
          id: string
          owner_id: string
          path: string
          title: string
          updated_at: string
          validation_state: Json
        }
        Insert: {
          blueprint_version_id: string
          checksum?: string | null
          content_md?: string
          created_at?: string
          document_type: string
          id?: string
          owner_id: string
          path: string
          title: string
          updated_at?: string
          validation_state?: Json
        }
        Update: {
          blueprint_version_id?: string
          checksum?: string | null
          content_md?: string
          created_at?: string
          document_type?: string
          id?: string
          owner_id?: string
          path?: string
          title?: string
          updated_at?: string
          validation_state?: Json
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_documents_blueprint_version_id_fkey"
            columns: ["blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_features: {
        Row: {
          blueprint_version_id: string
          created_at: string
          data: Json
          description: string
          id: string
          name: string
          outcome: string
          owner_id: string
          priority: string
          stable_key: string
        }
        Insert: {
          blueprint_version_id: string
          created_at?: string
          data?: Json
          description: string
          id?: string
          name: string
          outcome: string
          owner_id: string
          priority?: string
          stable_key: string
        }
        Update: {
          blueprint_version_id?: string
          created_at?: string
          data?: Json
          description?: string
          id?: string
          name?: string
          outcome?: string
          owner_id?: string
          priority?: string
          stable_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_features_blueprint_version_id_fkey"
            columns: ["blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_flows: {
        Row: {
          blueprint_version_id: string
          completion_text: string | null
          created_at: string
          data: Json
          id: string
          name: string
          owner_id: string
          preconditions: Json
          stable_key: string
          steps: Json
          trigger_text: string | null
        }
        Insert: {
          blueprint_version_id: string
          completion_text?: string | null
          created_at?: string
          data?: Json
          id?: string
          name: string
          owner_id: string
          preconditions?: Json
          stable_key: string
          steps?: Json
          trigger_text?: string | null
        }
        Update: {
          blueprint_version_id?: string
          completion_text?: string | null
          created_at?: string
          data?: Json
          id?: string
          name?: string
          owner_id?: string
          preconditions?: Json
          stable_key?: string
          steps?: Json
          trigger_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_flows_blueprint_version_id_fkey"
            columns: ["blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_requirements: {
        Row: {
          acceptance_criteria: Json
          blueprint_version_id: string
          created_at: string
          id: string
          owner_id: string
          priority: string
          rationale: string | null
          requirement_text: string
          stable_key: string
          title: string
          trace: Json
        }
        Insert: {
          acceptance_criteria?: Json
          blueprint_version_id: string
          created_at?: string
          id?: string
          owner_id: string
          priority?: string
          rationale?: string | null
          requirement_text: string
          stable_key: string
          title: string
          trace?: Json
        }
        Update: {
          acceptance_criteria?: Json
          blueprint_version_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          priority?: string
          rationale?: string | null
          requirement_text?: string
          stable_key?: string
          title?: string
          trace?: Json
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_requirements_blueprint_version_id_fkey"
            columns: ["blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_rules: {
        Row: {
          behavior_text: string
          blueprint_version_id: string
          condition_text: string
          created_at: string
          data: Json
          exceptions: Json
          id: string
          name: string
          owner_id: string
          stable_key: string
        }
        Insert: {
          behavior_text: string
          blueprint_version_id: string
          condition_text: string
          created_at?: string
          data?: Json
          exceptions?: Json
          id?: string
          name: string
          owner_id: string
          stable_key: string
        }
        Update: {
          behavior_text?: string
          blueprint_version_id?: string
          condition_text?: string
          created_at?: string
          data?: Json
          exceptions?: Json
          id?: string
          name?: string
          owner_id?: string
          stable_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_rules_blueprint_version_id_fkey"
            columns: ["blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_screens: {
        Row: {
          actions: Json
          blueprint_version_id: string
          components: Json
          created_at: string
          data: Json
          entry_points: Json
          id: string
          name: string
          navigation: Json
          owner_id: string
          purpose: string
          stable_key: string
          states: Json
        }
        Insert: {
          actions?: Json
          blueprint_version_id: string
          components?: Json
          created_at?: string
          data?: Json
          entry_points?: Json
          id?: string
          name: string
          navigation?: Json
          owner_id: string
          purpose: string
          stable_key: string
          states?: Json
        }
        Update: {
          actions?: Json
          blueprint_version_id?: string
          components?: Json
          created_at?: string
          data?: Json
          entry_points?: Json
          id?: string
          name?: string
          navigation?: Json
          owner_id?: string
          purpose?: string
          stable_key?: string
          states?: Json
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_screens_blueprint_version_id_fkey"
            columns: ["blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_tasks: {
        Row: {
          blueprint_version_id: string
          created_at: string
          definition_of_done: Json
          dependencies: Json
          guidance: string | null
          id: string
          implements: Json
          objective: string
          owner_id: string
          sequence: number | null
          stable_key: string
          test_obligations: Json
          title: string
        }
        Insert: {
          blueprint_version_id: string
          created_at?: string
          definition_of_done?: Json
          dependencies?: Json
          guidance?: string | null
          id?: string
          implements?: Json
          objective: string
          owner_id: string
          sequence?: number | null
          stable_key: string
          test_obligations?: Json
          title: string
        }
        Update: {
          blueprint_version_id?: string
          created_at?: string
          definition_of_done?: Json
          dependencies?: Json
          guidance?: string | null
          id?: string
          implements?: Json
          objective?: string
          owner_id?: string
          sequence?: number | null
          stable_key?: string
          test_obligations?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_tasks_blueprint_version_id_fkey"
            columns: ["blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_tests: {
        Row: {
          blueprint_version_id: string
          created_at: string
          expected_result: string
          id: string
          owner_id: string
          stable_key: string
          steps: Json
          test_type: string
          title: string
          validates: Json
        }
        Insert: {
          blueprint_version_id: string
          created_at?: string
          expected_result: string
          id?: string
          owner_id: string
          stable_key: string
          steps?: Json
          test_type: string
          title: string
          validates?: Json
        }
        Update: {
          blueprint_version_id?: string
          created_at?: string
          expected_result?: string
          id?: string
          owner_id?: string
          stable_key?: string
          steps?: Json
          test_type?: string
          title?: string
          validates?: Json
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_tests_blueprint_version_id_fkey"
            columns: ["blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_versions: {
        Row: {
          base_version_id: string | null
          change_summary: string | null
          consistency_review: Json | null
          created_at: string
          id: string
          is_current: boolean
          manifest: Json
          owner_id: string
          project_id: string
          published_at: string | null
          quality_score: number | null
          status: Database["public"]["Enums"]["blueprint_version_status"]
          version_number: number
        }
        Insert: {
          base_version_id?: string | null
          change_summary?: string | null
          consistency_review?: Json | null
          created_at?: string
          id?: string
          is_current?: boolean
          manifest?: Json
          owner_id: string
          project_id: string
          published_at?: string | null
          quality_score?: number | null
          status?: Database["public"]["Enums"]["blueprint_version_status"]
          version_number: number
        }
        Update: {
          base_version_id?: string | null
          change_summary?: string | null
          consistency_review?: Json | null
          created_at?: string
          id?: string
          is_current?: boolean
          manifest?: Json
          owner_id?: string
          project_id?: string
          published_at?: string | null
          quality_score?: number | null
          status?: Database["public"]["Enums"]["blueprint_version_status"]
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_versions_base_same_project_fk"
            columns: ["project_id", "base_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "blueprint_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          app_or_game: Database["public"]["Enums"]["app_or_game"]
          created_at: string
          external_mappings: Json
          id: string
          key: string
          name: string
          parent_id: string | null
        }
        Insert: {
          app_or_game: Database["public"]["Enums"]["app_or_game"]
          created_at?: string
          external_mappings?: Json
          id?: string
          key: string
          name: string
          parent_id?: string | null
        }
        Update: {
          app_or_game?: Database["public"]["Enums"]["app_or_game"]
          created_at?: string
          external_mappings?: Json
          id?: string
          key?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      change_impacts: {
        Row: {
          action: string
          artifact_key: string
          artifact_kind: string
          change_request_id: string
          created_at: string
          id: string
          owner_id: string
          proposed_change: string | null
          reason: string
          risk: string
        }
        Insert: {
          action: string
          artifact_key: string
          artifact_kind: string
          change_request_id: string
          created_at?: string
          id?: string
          owner_id: string
          proposed_change?: string | null
          reason: string
          risk: string
        }
        Update: {
          action?: string
          artifact_key?: string
          artifact_kind?: string
          change_request_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          proposed_change?: string | null
          reason?: string
          risk?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_impacts_change_request_id_fkey"
            columns: ["change_request_id"]
            isOneToOne: false
            referencedRelation: "change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          applied_version_id: string | null
          base_blueprint_version_id: string
          completed_at: string | null
          id: string
          impact_summary: Json | null
          normalized_request: string | null
          owner_id: string
          project_id: string
          request_text: string
          requested_at: string
          status: Database["public"]["Enums"]["change_request_status"]
        }
        Insert: {
          applied_version_id?: string | null
          base_blueprint_version_id: string
          completed_at?: string | null
          id?: string
          impact_summary?: Json | null
          normalized_request?: string | null
          owner_id: string
          project_id: string
          request_text: string
          requested_at?: string
          status?: Database["public"]["Enums"]["change_request_status"]
        }
        Update: {
          applied_version_id?: string | null
          base_blueprint_version_id?: string
          completed_at?: string | null
          id?: string
          impact_summary?: Json | null
          normalized_request?: string | null
          owner_id?: string
          project_id?: string
          request_text?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["change_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_applied_version_id_fkey"
            columns: ["applied_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_project_id_base_blueprint_version_id_fkey"
            columns: ["project_id", "base_blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_evidence: {
        Row: {
          claim_id: string
          evidence_id: string
          owner_id: string
          rationale: string | null
          relation: Database["public"]["Enums"]["evidence_relation"]
          strength: number | null
        }
        Insert: {
          claim_id: string
          evidence_id: string
          owner_id: string
          rationale?: string | null
          relation: Database["public"]["Enums"]["evidence_relation"]
          strength?: number | null
        }
        Update: {
          claim_id?: string
          evidence_id?: string
          owner_id?: string
          rationale?: string | null
          relation?: Database["public"]["Enums"]["evidence_relation"]
          strength?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_evidence_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          claim_text: string
          claim_type: string
          confidence: number
          created_at: string
          created_by_role: string | null
          id: string
          market_id: string | null
          normalized_claim: string | null
          owner_id: string
          verification: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          claim_text: string
          claim_type: string
          confidence?: number
          created_at?: string
          created_by_role?: string | null
          id?: string
          market_id?: string | null
          normalized_claim?: string | null
          owner_id: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          claim_text?: string
          claim_type?: string
          confidence?: number
          created_at?: string
          created_by_role?: string | null
          id?: string
          market_id?: string | null
          normalized_claim?: string | null
          owner_id?: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "claims_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_snapshots: {
        Row: {
          captured_at: string
          category_rank: number | null
          competitor_id: string
          download_estimate: number | null
          estimate_provider: string | null
          evidence_id: string | null
          features: Json
          id: string
          languages: Json
          last_update_at: string | null
          market_id: string | null
          monetization_summary: string | null
          owner_id: string
          payload: Json
          platform: string | null
          price_summary: string | null
          rating: number | null
          revenue_estimate: number | null
          review_count: number | null
          version: string | null
        }
        Insert: {
          captured_at?: string
          category_rank?: number | null
          competitor_id: string
          download_estimate?: number | null
          estimate_provider?: string | null
          evidence_id?: string | null
          features?: Json
          id?: string
          languages?: Json
          last_update_at?: string | null
          market_id?: string | null
          monetization_summary?: string | null
          owner_id: string
          payload?: Json
          platform?: string | null
          price_summary?: string | null
          rating?: number | null
          revenue_estimate?: number | null
          review_count?: number | null
          version?: string | null
        }
        Update: {
          captured_at?: string
          category_rank?: number | null
          competitor_id?: string
          download_estimate?: number | null
          estimate_provider?: string | null
          evidence_id?: string | null
          features?: Json
          id?: string
          languages?: Json
          last_update_at?: string | null
          market_id?: string | null
          monetization_summary?: string | null
          owner_id?: string
          payload?: Json
          platform?: string | null
          price_summary?: string | null
          rating?: number | null
          revenue_estimate?: number | null
          review_count?: number | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_snapshots_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_snapshots_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_snapshots_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          apple_app_id: string | null
          canonical_key: string | null
          canonical_name: string
          category_id: string | null
          created_at: string
          developer_name: string | null
          entity_type: string
          google_play_id: string | null
          id: string
          owner_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          apple_app_id?: string | null
          canonical_key?: string | null
          canonical_name: string
          category_id?: string | null
          created_at?: string
          developer_name?: string | null
          entity_type: string
          google_play_id?: string | null
          id?: string
          owner_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          apple_app_id?: string | null
          canonical_key?: string | null
          canonical_name?: string
          category_id?: string | null
          created_at?: string
          developer_name?: string | null
          entity_type?: string
          google_play_id?: string | null
          id?: string
          owner_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_competitors: {
        Row: {
          analysis: Json
          competitor_id: string
          concept_id: string
          incumbent_pressure: number | null
          owner_id: string
          relation: Database["public"]["Enums"]["competitor_relation"]
        }
        Insert: {
          analysis?: Json
          competitor_id: string
          concept_id: string
          incumbent_pressure?: number | null
          owner_id: string
          relation: Database["public"]["Enums"]["competitor_relation"]
        }
        Update: {
          analysis?: Json
          competitor_id?: string
          concept_id?: string
          incumbent_pressure?: number | null
          owner_id?: string
          relation?: Database["public"]["Enums"]["competitor_relation"]
        }
        Relationships: [
          {
            foreignKeyName: "concept_competitors_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_competitors_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_markets: {
        Row: {
          concept_id: string
          market_id: string
          owner_id: string
          priority: number | null
        }
        Insert: {
          concept_id: string
          market_id: string
          owner_id: string
          priority?: number | null
        }
        Update: {
          concept_id?: string
          market_id?: string
          owner_id?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "concept_markets_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_markets_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      confidence_snapshots: {
        Row: {
          calculated_at: string
          components: Json
          concept_id: string
          confidence: number
          id: string
          market_id: string | null
          owner_id: string
        }
        Insert: {
          calculated_at?: string
          components: Json
          concept_id: string
          confidence: number
          id?: string
          market_id?: string | null
          owner_id: string
        }
        Update: {
          calculated_at?: string
          components?: Json
          concept_id?: string
          confidence?: number
          id?: string
          market_id?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confidence_snapshots_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confidence_snapshots_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_promotions: {
        Row: {
          best_candidate_concept_id: string | null
          concept_id: string | null
          confidence_snapshot_id: string | null
          created_at: string
          id: string
          metadata: Json
          no_promotion_reason: string | null
          owner_id: string
          promoted: boolean
          promotion_date: string
          recommendation_id: string | null
          score_snapshot_id: string | null
          timezone: string
        }
        Insert: {
          best_candidate_concept_id?: string | null
          concept_id?: string | null
          confidence_snapshot_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          no_promotion_reason?: string | null
          owner_id: string
          promoted?: boolean
          promotion_date: string
          recommendation_id?: string | null
          score_snapshot_id?: string | null
          timezone: string
        }
        Update: {
          best_candidate_concept_id?: string | null
          concept_id?: string | null
          confidence_snapshot_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          no_promotion_reason?: string | null
          owner_id?: string
          promoted?: boolean
          promotion_date?: string
          recommendation_id?: string | null
          score_snapshot_id?: string | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_promotions_best_candidate_concept_id_fkey"
            columns: ["best_candidate_concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_promotions_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_promotions_confidence_snapshot_id_fkey"
            columns: ["confidence_snapshot_id"]
            isOneToOne: false
            referencedRelation: "confidence_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_promotions_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_promotions_score_snapshot_id_fkey"
            columns: ["score_snapshot_id"]
            isOneToOne: false
            referencedRelation: "score_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          canonical_url: string | null
          collected_at: string
          content_hash: string
          created_at: string
          external_id: string | null
          id: string
          language: string | null
          market_id: string | null
          normalized_payload: Json | null
          normalized_text: string | null
          owner_id: string
          parser_version: string | null
          published_at: string | null
          raw_payload: Json | null
          raw_text: string | null
          research_run_id: string | null
          retention_metadata: Json
          source_id: string
          source_run_id: string | null
          source_type: string
          title: string | null
        }
        Insert: {
          canonical_url?: string | null
          collected_at?: string
          content_hash: string
          created_at?: string
          external_id?: string | null
          id?: string
          language?: string | null
          market_id?: string | null
          normalized_payload?: Json | null
          normalized_text?: string | null
          owner_id: string
          parser_version?: string | null
          published_at?: string | null
          raw_payload?: Json | null
          raw_text?: string | null
          research_run_id?: string | null
          retention_metadata?: Json
          source_id: string
          source_run_id?: string | null
          source_type: string
          title?: string | null
        }
        Update: {
          canonical_url?: string | null
          collected_at?: string
          content_hash?: string
          created_at?: string
          external_id?: string | null
          id?: string
          language?: string | null
          market_id?: string | null
          normalized_payload?: Json | null
          normalized_text?: string | null
          owner_id?: string
          parser_version?: string | null
          published_at?: string | null
          raw_payload?: Json | null
          raw_text?: string | null
          research_run_id?: string | null
          retention_metadata?: Json
          source_id?: string
          source_run_id?: string | null
          source_type?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_research_run_id_fkey"
            columns: ["research_run_id"]
            isOneToOne: false
            referencedRelation: "research_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "research_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_source_run_id_fkey"
            columns: ["source_run_id"]
            isOneToOne: false
            referencedRelation: "source_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      export_packages: {
        Row: {
          archive_checksum: string | null
          blueprint_version_id: string
          created_at: string
          id: string
          manifest: Json
          owner_id: string
          project_id: string
          status: string
          storage_path: string
        }
        Insert: {
          archive_checksum?: string | null
          blueprint_version_id: string
          created_at?: string
          id?: string
          manifest: Json
          owner_id: string
          project_id: string
          status?: string
          storage_path: string
        }
        Update: {
          archive_checksum?: string | null
          blueprint_version_id?: string
          created_at?: string
          id?: string
          manifest?: Json
          owner_id?: string
          project_id?: string
          status?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_packages_project_id_blueprint_version_id_fkey"
            columns: ["project_id", "blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "export_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kill_assessments: {
        Row: {
          concept_id: string
          evaluated_at: string
          evidence_ids: Json
          id: string
          market_id: string | null
          owner_id: string
          rationale: string | null
          result: string
          rule_key: string
          rule_version: string
          severity: string
        }
        Insert: {
          concept_id: string
          evaluated_at?: string
          evidence_ids?: Json
          id?: string
          market_id?: string | null
          owner_id: string
          rationale?: string | null
          result: string
          rule_key: string
          rule_version: string
          severity: string
        }
        Update: {
          concept_id?: string
          evaluated_at?: string
          evidence_ids?: Json
          id?: string
          market_id?: string | null
          owner_id?: string
          rationale?: string | null
          result?: string
          rule_key?: string
          rule_version?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "kill_assessments_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kill_assessments_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          code: string
          created_at: string
          enabled_by_default: boolean
          id: string
          is_global: boolean
          name: string
          region: string | null
        }
        Insert: {
          code: string
          created_at?: string
          enabled_by_default?: boolean
          id?: string
          is_global?: boolean
          name: string
          region?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          enabled_by_default?: boolean
          id?: string
          is_global?: boolean
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          app_or_game: Database["public"]["Enums"]["app_or_game"]
          category_id: string | null
          created_at: string
          embedding: string | null
          embedding_model: string | null
          first_seen_at: string
          id: string
          job_to_be_done: string
          last_seen_at: string
          lifecycle_status: string
          normalized_key: string | null
          opportunity_type: string
          owner_id: string
          problem_statement: string
          target_audience: string
          title: string
          updated_at: string
          why_now: string
        }
        Insert: {
          app_or_game: Database["public"]["Enums"]["app_or_game"]
          category_id?: string | null
          created_at?: string
          embedding?: string | null
          embedding_model?: string | null
          first_seen_at?: string
          id?: string
          job_to_be_done: string
          last_seen_at?: string
          lifecycle_status?: string
          normalized_key?: string | null
          opportunity_type: string
          owner_id: string
          problem_statement: string
          target_audience: string
          title: string
          updated_at?: string
          why_now: string
        }
        Update: {
          app_or_game?: Database["public"]["Enums"]["app_or_game"]
          category_id?: string | null
          created_at?: string
          embedding?: string | null
          embedding_model?: string | null
          first_seen_at?: string
          id?: string
          job_to_be_done?: string
          last_seen_at?: string
          lifecycle_status?: string
          normalized_key?: string | null
          opportunity_type?: string
          owner_id?: string
          problem_statement?: string
          target_audience?: string
          title?: string
          updated_at?: string
          why_now?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_markets: {
        Row: {
          market_id: string
          notes: Json
          opportunity_id: string
          owner_id: string
          relevance: number | null
        }
        Insert: {
          market_id: string
          notes?: Json
          opportunity_id: string
          owner_id: string
          relevance?: number | null
        }
        Update: {
          market_id?: string
          notes?: Json
          opportunity_id?: string
          owner_id?: string
          relevance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_markets_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_markets_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_signals: {
        Row: {
          opportunity_id: string
          owner_id: string
          signal_id: string
        }
        Insert: {
          opportunity_id: string
          owner_id: string
          signal_id: string
        }
        Update: {
          opportunity_id?: string
          owner_id?: string
          signal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_signals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_signals_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_timeline_events: {
        Row: {
          concept_id: string | null
          event_type: string
          id: string
          occurred_at: string
          opportunity_id: string | null
          owner_id: string
          payload: Json
          summary: string
        }
        Insert: {
          concept_id?: string | null
          event_type: string
          id?: string
          occurred_at?: string
          opportunity_id?: string | null
          owner_id: string
          payload?: Json
          summary: string
        }
        Update: {
          concept_id?: string | null
          event_type?: string
          id?: string
          occurred_at?: string
          opportunity_id?: string | null
          owner_id?: string
          payload?: Json
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_timeline_events_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_timeline_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_market_preferences: {
        Row: {
          enabled: boolean
          market_id: string
          owner_id: string
          priority: number
        }
        Insert: {
          enabled?: boolean
          market_id: string
          owner_id: string
          priority?: number
        }
        Update: {
          enabled?: boolean
          market_id?: string
          owner_id?: string
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "owner_market_preferences_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      product_concepts: {
        Row: {
          ai_dependency: string | null
          created_at: string
          differentiation_hypothesis: string | null
          disposition: Database["public"]["Enums"]["user_disposition"]
          distribution_candidates: Json
          first_analyzed_at: string | null
          id: string
          last_analyzed_at: string | null
          monetization_candidates: Json
          mvp_thesis: string | null
          opportunity_id: string
          owner_id: string
          risks: Json
          target_user: string
          technical_dependencies: Json
          title: string
          updated_at: string
          value_proposition: string
          wedge: string
        }
        Insert: {
          ai_dependency?: string | null
          created_at?: string
          differentiation_hypothesis?: string | null
          disposition?: Database["public"]["Enums"]["user_disposition"]
          distribution_candidates?: Json
          first_analyzed_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          monetization_candidates?: Json
          mvp_thesis?: string | null
          opportunity_id: string
          owner_id: string
          risks?: Json
          target_user: string
          technical_dependencies?: Json
          title: string
          updated_at?: string
          value_proposition: string
          wedge: string
        }
        Update: {
          ai_dependency?: string | null
          created_at?: string
          differentiation_hypothesis?: string | null
          disposition?: Database["public"]["Enums"]["user_disposition"]
          distribution_candidates?: Json
          first_analyzed_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          monetization_candidates?: Json
          mvp_thesis?: string | null
          opportunity_id?: string
          owner_id?: string
          risks?: Json
          target_user?: string
          technical_dependencies?: Json
          title?: string
          updated_at?: string
          value_proposition?: string
          wedge?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_concepts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          concept_id: string
          created_at: string
          current_blueprint_version_id: string | null
          frozen_research_snapshot: Json
          id: string
          name: string
          owner_id: string
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          concept_id: string
          created_at?: string
          current_blueprint_version_id?: string | null
          frozen_research_snapshot: Json
          id?: string
          name: string
          owner_id: string
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          concept_id?: string
          created_at?: string
          current_blueprint_version_id?: string | null
          frozen_research_snapshot?: Json
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_current_version_same_project_fk"
            columns: ["id", "current_blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          release_notes: string | null
          role_key: string
          schema_version: string | null
          template: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
          release_notes?: string | null
          role_key: string
          schema_version?: string | null
          template: string
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          release_notes?: string | null
          role_key?: string
          schema_version?: string | null
          template?: string
          version?: string
        }
        Relationships: []
      }
      prototype_artifacts: {
        Row: {
          artifact_type: string
          blueprint_version_id: string
          created_at: string
          external_ref: Json
          id: string
          owner_id: string
          project_id: string
          spec: Json
          stale_keys: Json
          status: Database["public"]["Enums"]["prototype_status"]
          updated_at: string
        }
        Insert: {
          artifact_type: string
          blueprint_version_id: string
          created_at?: string
          external_ref?: Json
          id?: string
          owner_id: string
          project_id: string
          spec?: Json
          stale_keys?: Json
          status?: Database["public"]["Enums"]["prototype_status"]
          updated_at?: string
        }
        Update: {
          artifact_type?: string
          blueprint_version_id?: string
          created_at?: string
          external_ref?: Json
          id?: string
          owner_id?: string
          project_id?: string
          spec?: Json
          stale_keys?: Json
          status?: Database["public"]["Enums"]["prototype_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prototype_artifacts_project_id_blueprint_version_id_fkey"
            columns: ["project_id", "blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "prototype_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_reports: {
        Row: {
          blueprint_version_id: string
          created_at: string
          findings: Json
          gates: Json
          id: string
          mandatory_pass: boolean
          overall_score: number | null
          owner_id: string
          project_id: string
        }
        Insert: {
          blueprint_version_id: string
          created_at?: string
          findings?: Json
          gates: Json
          id?: string
          mandatory_pass?: boolean
          overall_score?: number | null
          owner_id: string
          project_id: string
        }
        Update: {
          blueprint_version_id?: string
          created_at?: string
          findings?: Json
          gates?: Json
          id?: string
          mandatory_pass?: boolean
          overall_score?: number | null
          owner_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_reports_project_id_blueprint_version_id_fkey"
            columns: ["project_id", "blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "quality_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          biggest_risk: string | null
          concept_id: string
          confidence_snapshot_id: string | null
          created_at: string
          id: string
          market_id: string | null
          owner_id: string
          rationale: string
          score_snapshot_id: string | null
          status: Database["public"]["Enums"]["recommendation_status"]
          strongest_evidence_ids: Json
          validation_priorities: Json
        }
        Insert: {
          biggest_risk?: string | null
          concept_id: string
          confidence_snapshot_id?: string | null
          created_at?: string
          id?: string
          market_id?: string | null
          owner_id: string
          rationale: string
          score_snapshot_id?: string | null
          status: Database["public"]["Enums"]["recommendation_status"]
          strongest_evidence_ids?: Json
          validation_priorities?: Json
        }
        Update: {
          biggest_risk?: string | null
          concept_id?: string
          confidence_snapshot_id?: string | null
          created_at?: string
          id?: string
          market_id?: string | null
          owner_id?: string
          rationale?: string
          score_snapshot_id?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          strongest_evidence_ids?: Json
          validation_priorities?: Json
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_confidence_snapshot_id_fkey"
            columns: ["confidence_snapshot_id"]
            isOneToOne: false
            referencedRelation: "confidence_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_score_snapshot_id_fkey"
            columns: ["score_snapshot_id"]
            isOneToOne: false
            referencedRelation: "score_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      research_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          id: string
          idempotency_key: string
          job_type: string
          last_error_code: string | null
          last_error_message: string | null
          leased_at: string | null
          max_attempts: number
          next_retry_at: string | null
          owner_id: string
          payload: Json
          queue_message_id: number | null
          research_run_id: string | null
          result_ref: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["research_job_status"]
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key: string
          job_type: string
          last_error_code?: string | null
          last_error_message?: string | null
          leased_at?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          owner_id: string
          payload?: Json
          queue_message_id?: number | null
          research_run_id?: string | null
          result_ref?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["research_job_status"]
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string
          job_type?: string
          last_error_code?: string | null
          last_error_message?: string | null
          leased_at?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          owner_id?: string
          payload?: Json
          queue_message_id?: number | null
          research_run_id?: string | null
          result_ref?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["research_job_status"]
        }
        Relationships: [
          {
            foreignKeyName: "research_jobs_research_run_id_fkey"
            columns: ["research_run_id"]
            isOneToOne: false
            referencedRelation: "research_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      research_runs: {
        Row: {
          ai_budget_usd: number
          ai_cost_usd: number
          completed_at: string | null
          config_snapshot: Json
          created_at: string
          error_summary: Json
          external_budget_usd: number
          external_cost_usd: number
          id: string
          mode: string
          owner_id: string
          request_key: string | null
          started_at: string | null
          stats: Json
          status: Database["public"]["Enums"]["research_run_status"]
          warning_count: number
        }
        Insert: {
          ai_budget_usd?: number
          ai_cost_usd?: number
          completed_at?: string | null
          config_snapshot: Json
          created_at?: string
          error_summary?: Json
          external_budget_usd?: number
          external_cost_usd?: number
          id?: string
          mode: string
          owner_id: string
          request_key?: string | null
          started_at?: string | null
          stats?: Json
          status?: Database["public"]["Enums"]["research_run_status"]
          warning_count?: number
        }
        Update: {
          ai_budget_usd?: number
          ai_cost_usd?: number
          completed_at?: string | null
          config_snapshot?: Json
          created_at?: string
          error_summary?: Json
          external_budget_usd?: number
          external_cost_usd?: number
          id?: string
          mode?: string
          owner_id?: string
          request_key?: string | null
          started_at?: string | null
          stats?: Json
          status?: Database["public"]["Enums"]["research_run_status"]
          warning_count?: number
        }
        Relationships: []
      }
      research_sources: {
        Row: {
          capabilities: Json
          config: Json
          created_at: string
          enabled: boolean
          id: string
          is_paid: boolean
          key: string
          last_error_code: string | null
          last_success_at: string | null
          name: string
          owner_id: string
          reliability_profile: Json
          source_type: string
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          is_paid?: boolean
          key: string
          last_error_code?: string | null
          last_success_at?: string | null
          name: string
          owner_id: string
          reliability_profile?: Json
          source_type: string
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          is_paid?: boolean
          key?: string
          last_error_code?: string | null
          last_success_at?: string | null
          name?: string
          owner_id?: string
          reliability_profile?: Json
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_cluster_members: {
        Row: {
          cluster_id: string
          owner_id: string
          review_item_id: string
        }
        Insert: {
          cluster_id: string
          owner_id: string
          review_item_id: string
        }
        Update: {
          cluster_id?: string
          owner_id?: string
          review_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_cluster_members_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "review_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_cluster_members_review_item_id_fkey"
            columns: ["review_item_id"]
            isOneToOne: false
            referencedRelation: "review_items"
            referencedColumns: ["id"]
          },
        ]
      }
      review_clusters: {
        Row: {
          category: string
          competitor_id: string | null
          concept_id: string | null
          confidence: number
          created_at: string
          first_observed_at: string | null
          id: string
          language: string | null
          last_observed_at: string | null
          market_id: string | null
          member_count: number
          owner_id: string
          sample_size: number
          sentiment: string
          summary: string | null
          theme: string
        }
        Insert: {
          category: string
          competitor_id?: string | null
          concept_id?: string | null
          confidence?: number
          created_at?: string
          first_observed_at?: string | null
          id?: string
          language?: string | null
          last_observed_at?: string | null
          market_id?: string | null
          member_count?: number
          owner_id: string
          sample_size?: number
          sentiment: string
          summary?: string | null
          theme: string
        }
        Update: {
          category?: string
          competitor_id?: string | null
          concept_id?: string | null
          confidence?: number
          created_at?: string
          first_observed_at?: string | null
          id?: string
          language?: string | null
          last_observed_at?: string | null
          market_id?: string | null
          member_count?: number
          owner_id?: string
          sample_size?: number
          sentiment?: string
          summary?: string | null
          theme?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_clusters_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_clusters_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_clusters_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      review_items: {
        Row: {
          classification: Json
          competitor_id: string | null
          created_at: string
          evidence_id: string | null
          external_id: string | null
          id: string
          language: string | null
          market_id: string | null
          owner_id: string
          published_at: string | null
          rating: number | null
          review_text: string | null
        }
        Insert: {
          classification?: Json
          competitor_id?: string | null
          created_at?: string
          evidence_id?: string | null
          external_id?: string | null
          id?: string
          language?: string | null
          market_id?: string | null
          owner_id: string
          published_at?: string | null
          rating?: number | null
          review_text?: string | null
        }
        Update: {
          classification?: Json
          competitor_id?: string | null
          created_at?: string
          evidence_id?: string | null
          external_id?: string | null
          id?: string
          language?: string | null
          market_id?: string | null
          owner_id?: string
          published_at?: string | null
          rating?: number | null
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_items_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_items_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_items_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      score_snapshots: {
        Row: {
          calculated_at: string
          concept_id: string
          factors: Json
          id: string
          market_id: string | null
          overall_score: number
          owner_id: string
          scoring_model_id: string
        }
        Insert: {
          calculated_at?: string
          concept_id: string
          factors: Json
          id?: string
          market_id?: string | null
          overall_score: number
          owner_id: string
          scoring_model_id: string
        }
        Update: {
          calculated_at?: string
          concept_id?: string
          factors?: Json
          id?: string
          market_id?: string | null
          overall_score?: number
          owner_id?: string
          scoring_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_snapshots_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "product_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_snapshots_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_snapshots_scoring_model_id_fkey"
            columns: ["scoring_model_id"]
            isOneToOne: false
            referencedRelation: "scoring_models"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_models: {
        Row: {
          active: boolean
          app_or_game: Database["public"]["Enums"]["app_or_game"]
          created_at: string
          id: string
          model_key: string
          owner_id: string
          thresholds: Json
          version: string
          weights: Json
        }
        Insert: {
          active?: boolean
          app_or_game: Database["public"]["Enums"]["app_or_game"]
          created_at?: string
          id?: string
          model_key: string
          owner_id: string
          thresholds: Json
          version: string
          weights: Json
        }
        Update: {
          active?: boolean
          app_or_game?: Database["public"]["Enums"]["app_or_game"]
          created_at?: string
          id?: string
          model_key?: string
          owner_id?: string
          thresholds?: Json
          version?: string
          weights?: Json
        }
        Relationships: []
      }
      signal_cluster_members: {
        Row: {
          cluster_id: string
          owner_id: string
          signal_id: string
          similarity: number | null
        }
        Insert: {
          cluster_id: string
          owner_id: string
          signal_id: string
          similarity?: number | null
        }
        Update: {
          cluster_id?: string
          owner_id?: string
          signal_id?: string
          similarity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_cluster_members_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "signal_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signal_cluster_members_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_clusters: {
        Row: {
          cluster_key: string | null
          confidence: number
          created_at: string
          embedding: string | null
          id: string
          owner_id: string
          research_run_id: string | null
          summary: string
          title: string
        }
        Insert: {
          cluster_key?: string | null
          confidence?: number
          created_at?: string
          embedding?: string | null
          id?: string
          owner_id: string
          research_run_id?: string | null
          summary: string
          title: string
        }
        Update: {
          cluster_key?: string | null
          confidence?: number
          created_at?: string
          embedding?: string | null
          id?: string
          owner_id?: string
          research_run_id?: string | null
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_clusters_research_run_id_fkey"
            columns: ["research_run_id"]
            isOneToOne: false
            referencedRelation: "research_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_evidence: {
        Row: {
          claim_id: string | null
          evidence_id: string | null
          id: string
          owner_id: string
          signal_id: string
        }
        Insert: {
          claim_id?: string | null
          evidence_id?: string | null
          id?: string
          owner_id: string
          signal_id: string
        }
        Update: {
          claim_id?: string | null
          evidence_id?: string | null
          id?: string
          owner_id?: string
          signal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signal_evidence_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signal_evidence_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          category_id: string | null
          confidence: number
          created_at: string
          direction: string
          id: string
          is_estimate: boolean
          market_id: string | null
          observed_at: string
          owner_id: string
          raw_unit: string | null
          raw_value: number | null
          research_run_id: string | null
          signal_type: string
          strength: number | null
          strength_class: string | null
          summary: string
          title: string
        }
        Insert: {
          category_id?: string | null
          confidence?: number
          created_at?: string
          direction: string
          id?: string
          is_estimate?: boolean
          market_id?: string | null
          observed_at?: string
          owner_id: string
          raw_unit?: string | null
          raw_value?: number | null
          research_run_id?: string | null
          signal_type: string
          strength?: number | null
          strength_class?: string | null
          summary: string
          title: string
        }
        Update: {
          category_id?: string | null
          confidence?: number
          created_at?: string
          direction?: string
          id?: string
          is_estimate?: boolean
          market_id?: string | null
          observed_at?: string
          owner_id?: string
          raw_unit?: string | null
          raw_value?: number | null
          research_run_id?: string | null
          signal_type?: string
          strength?: number | null
          strength_class?: string | null
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_research_run_id_fkey"
            columns: ["research_run_id"]
            isOneToOne: false
            referencedRelation: "research_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      source_runs: {
        Row: {
          completed_at: string | null
          coverage: Json
          created_at: string
          error_code: string | null
          id: string
          item_count: number
          market_id: string | null
          owner_id: string
          research_run_id: string
          source_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          coverage?: Json
          created_at?: string
          error_code?: string | null
          id?: string
          item_count?: number
          market_id?: string | null
          owner_id: string
          research_run_id: string
          source_id: string
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          coverage?: Json
          created_at?: string
          error_code?: string | null
          id?: string
          item_count?: number
          market_id?: string | null
          owner_id?: string
          research_run_id?: string
          source_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_runs_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_runs_research_run_id_fkey"
            columns: ["research_run_id"]
            isOneToOne: false
            referencedRelation: "research_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "research_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      traceability_links: {
        Row: {
          blueprint_version_id: string | null
          created_at: string
          id: string
          metadata: Json
          owner_id: string
          project_id: string
          relation: string
          source_key: string
          source_kind: string
          target_key: string
          target_kind: string
        }
        Insert: {
          blueprint_version_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          owner_id: string
          project_id: string
          relation: string
          source_key: string
          source_kind: string
          target_key: string
          target_kind: string
        }
        Update: {
          blueprint_version_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          owner_id?: string
          project_id?: string
          relation?: string
          source_key?: string
          source_kind?: string
          target_key?: string
          target_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "traceability_links_project_id_blueprint_version_id_fkey"
            columns: ["project_id", "blueprint_version_id"]
            isOneToOne: false
            referencedRelation: "blueprint_versions"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "traceability_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_weighted_score: {
        Args: { factors: Json; weights: Json }
        Returns: number
      }
      can_be_ready_for_development: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      center_activate_prompt: {
        Args: { p_owner: string; p_prompt: string }
        Returns: undefined
      }
      center_apply_change: {
        Args: { p_change: string; p_owner: string; p_report: Json }
        Returns: string
      }
      center_claim: { Args: { p_queue: string }; Returns: Json }
      center_enqueue: {
        Args: {
          p_key: string
          p_owner: string
          p_payload: Json
          p_run?: string
          p_type: string
        }
        Returns: string
      }
      center_finish: {
        Args: {
          p_error?: string
          p_job: string
          p_message: number
          p_queue: string
          p_result: Json
          p_retry?: boolean
        }
        Returns: undefined
      }
      center_finish_attempt: {
        Args: {
          p_attempt: number
          p_error?: string
          p_job: string
          p_message: number
          p_queue: string
          p_result: Json
          p_retry?: boolean
        }
        Returns: undefined
      }
      center_go: {
        Args: { p_concept: string; p_key: string; p_owner: string }
        Returns: string
      }
      center_publish: {
        Args: {
          p_owner: string
          p_project: string
          p_report: Json
          p_version: string
        }
        Returns: undefined
      }
      center_reserve_ai: {
        Args: {
          p_job?: string
          p_max: number
          p_owner: string
          p_project?: string
          p_role: string
          p_run?: string
        }
        Returns: string
      }
      center_retry_job: {
        Args: { p_job: string; p_owner: string }
        Returns: undefined
      }
      center_save_blueprint: {
        Args: {
          p_bundle: Json
          p_expected: string
          p_owner: string
          p_project: string
          p_summary?: string
        }
        Returns: string
      }
      center_similar_opportunities: {
        Args: {
          p_kind: Database["public"]["Enums"]["app_or_game"]
          p_model: string
          p_owner: string
          p_threshold?: number
          p_vector: string
        }
        Returns: {
          id: string
          similarity: number
        }[]
      }
      center_start_run: {
        Args: {
          p_budget: number
          p_config: Json
          p_key: string
          p_mode?: string
          p_owner: string
        }
        Returns: string
      }
    }
    Enums: {
      app_or_game: "app" | "game"
      blueprint_version_status:
        | "draft"
        | "validating"
        | "published"
        | "superseded"
        | "failed_validation"
      change_request_status:
        | "created"
        | "analyzing"
        | "impact_ready"
        | "approved"
        | "applying"
        | "validating"
        | "published"
        | "failed_validation"
        | "cancelled"
      competitor_relation: "direct" | "indirect" | "substitute"
      evidence_relation:
        | "supports"
        | "contradicts"
        | "contextualizes"
        | "estimates"
      project_status:
        | "blueprint_draft"
        | "blueprint_review"
        | "prototype_ready"
        | "quality_blocked"
        | "ready_for_development"
        | "archived"
      prototype_status:
        | "not_generated"
        | "generating"
        | "current"
        | "stale"
        | "failed"
      recommendation_status:
        | "STRONG_BUILD"
        | "BUILD"
        | "VALIDATE_FIRST"
        | "WATCH"
        | "PASS"
        | "KILLED"
      research_job_status:
        | "queued"
        | "leased"
        | "running"
        | "succeeded"
        | "retry_wait"
        | "dead_letter"
        | "cancelled"
      research_run_status:
        | "queued"
        | "running"
        | "completed"
        | "completed_with_warnings"
        | "budget_limited"
        | "failed"
        | "cancelled"
      user_disposition:
        | "undecided"
        | "shortlisted"
        | "watching"
        | "go"
        | "passed"
        | "archived"
      verification_status:
        | "verified"
        | "supported"
        | "inferred"
        | "estimated"
        | "unknown"
        | "contradicted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_or_game: ["app", "game"],
      blueprint_version_status: [
        "draft",
        "validating",
        "published",
        "superseded",
        "failed_validation",
      ],
      change_request_status: [
        "created",
        "analyzing",
        "impact_ready",
        "approved",
        "applying",
        "validating",
        "published",
        "failed_validation",
        "cancelled",
      ],
      competitor_relation: ["direct", "indirect", "substitute"],
      evidence_relation: [
        "supports",
        "contradicts",
        "contextualizes",
        "estimates",
      ],
      project_status: [
        "blueprint_draft",
        "blueprint_review",
        "prototype_ready",
        "quality_blocked",
        "ready_for_development",
        "archived",
      ],
      prototype_status: [
        "not_generated",
        "generating",
        "current",
        "stale",
        "failed",
      ],
      recommendation_status: [
        "STRONG_BUILD",
        "BUILD",
        "VALIDATE_FIRST",
        "WATCH",
        "PASS",
        "KILLED",
      ],
      research_job_status: [
        "queued",
        "leased",
        "running",
        "succeeded",
        "retry_wait",
        "dead_letter",
        "cancelled",
      ],
      research_run_status: [
        "queued",
        "running",
        "completed",
        "completed_with_warnings",
        "budget_limited",
        "failed",
        "cancelled",
      ],
      user_disposition: [
        "undecided",
        "shortlisted",
        "watching",
        "go",
        "passed",
        "archived",
      ],
      verification_status: [
        "verified",
        "supported",
        "inferred",
        "estimated",
        "unknown",
        "contradicted",
      ],
    },
  },
} as const
