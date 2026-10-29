export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      opinions: {
        Row: {
          armo_sin_ayuda: boolean | null
          codigo_encuestador: string | null
          comentario: string | null
          comment: string | null
          created_at: string
          id: string
          lo_usaria: string | null
          name: string | null
          order_code: string | null
          precio_justo: string | null
          rating: number | null
          satisfaccion: number | null
          servicio_preferido: string | null
          tiempo_segundos: number | null
          whatsapp: string | null
          zona: string | null
        }
        Insert: {
          armo_sin_ayuda?: boolean | null
          codigo_encuestador?: string | null
          comentario?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          lo_usaria?: string | null
          name?: string | null
          order_code?: string | null
          precio_justo?: string | null
          rating?: number | null
          satisfaccion?: number | null
          servicio_preferido?: string | null
          tiempo_segundos?: number | null
          whatsapp?: string | null
          zona?: string | null
        }
        Update: {
          armo_sin_ayuda?: boolean | null
          codigo_encuestador?: string | null
          comentario?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          lo_usaria?: string | null
          name?: string | null
          order_code?: string | null
          precio_justo?: string | null
          rating?: number | null
          satisfaccion?: number | null
          servicio_preferido?: string | null
          tiempo_segundos?: number | null
          whatsapp?: string | null
          zona?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opinions_order_code_fkey"
            columns: ["order_code"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["code"]
          },
        ]
      }
      order_items_photos: {
        Row: {
          client_comment: string | null
          id: string
          item_index: number
          order_code: string
          photo_url: string | null
          real_price: number | null
          responded_at: string | null
          status: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          client_comment?: string | null
          id?: string
          item_index: number
          order_code: string
          photo_url?: string | null
          real_price?: number | null
          responded_at?: string | null
          status?: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          client_comment?: string | null
          id?: string
          item_index?: number
          order_code?: string
          photo_url?: string | null
          real_price?: number | null
          responded_at?: string | null
          status?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_photos_order_code_fkey"
            columns: ["order_code"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["code"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          business: string
          code: string
          contact: string
          created_at: string
          delivery_date: string | null
          history: Json
          id: string
          items: Json
          packages: number
          payment_method: string | null
          payment_plan: string | null
          payment_status: string
          phone: string
          service: string
          service_fee: number
          shipping_fee: number
          slot: string | null
          status: string
          subtotal: number
          taxi: Json | null
          total: number
          weight_kg: number
          zone: string | null
        }
        Insert: {
          address?: string | null
          business: string
          code?: string
          contact: string
          created_at?: string
          delivery_date?: string | null
          history?: Json
          id?: string
          items?: Json
          packages?: number
          payment_method?: string | null
          payment_plan?: string | null
          payment_status?: string
          phone: string
          service: string
          service_fee?: number
          shipping_fee?: number
          slot?: string | null
          status?: string
          subtotal?: number
          taxi?: Json | null
          total?: number
          weight_kg?: number
          zone?: string | null
        }
        Update: {
          address?: string | null
          business?: string
          code?: string
          contact?: string
          created_at?: string
          delivery_date?: string | null
          history?: Json
          id?: string
          items?: Json
          packages?: number
          payment_method?: string | null
          payment_plan?: string | null
          payment_status?: string
          phone?: string
          service?: string
          service_fee?: number
          shipping_fee?: number
          slot?: string | null
          status?: string
          subtotal?: number
          taxi?: Json | null
          total?: number
          weight_kg?: number
          zone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: { Args: { p: Json }; Returns: string }
      get_order_by_code: {
        Args: { _code: string }
        Returns: {
          address: string | null
          business: string
          code: string
          contact: string
          created_at: string
          delivery_date: string | null
          history: Json
          id: string
          items: Json
          packages: number
          payment_method: string | null
          payment_plan: string | null
          payment_status: string
          phone: string
          service: string
          service_fee: number
          shipping_fee: number
          slot: string | null
          status: string
          subtotal: number
          taxi: Json | null
          total: number
          weight_kg: number
          zone: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_order_photos: {
        Args: { _code: string }
        Returns: {
          client_comment: string | null
          id: string
          item_index: number
          order_code: string
          photo_url: string | null
          real_price: number | null
          responded_at: string | null
          status: string
          updated_at: string
          uploaded_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "order_items_photos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      respond_photo: {
        Args: {
          _approve: boolean
          _code: string
          _comment?: string
          _item_index: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
