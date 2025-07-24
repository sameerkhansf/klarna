-- Create the 'users' table
CREATE TABLE public.users
(
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE,
  name text,
  created_at timestamp
  with time zone DEFAULT now
  ()
);

  -- Create the 'settlements' table
  CREATE TABLE public.settlements
  (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    deadline text,
    payout_min integer,
    payout_max integer,
    claim_url text,
    requires_proof boolean DEFAULT false,
    proof_limit integer,
    form_type text,
    fields jsonb,
    created_at timestamp
    with time zone DEFAULT now
    ()
);

    -- Create the 'user_claims' table
    CREATE TABLE public.user_claims
    (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
      settlement_id uuid REFERENCES public.settlements ON DELETE CASCADE NOT NULL,
      data_json jsonb,
      status text DEFAULT 'pending'
      ::text,
  pdf_url text,
  created_at timestamp
      with time zone DEFAULT now
      ()
);

      -- Create the 'user_profiles' table for onboarding/profile info
      CREATE TABLE public.user_profiles
      (
        id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        email text NOT NULL,
        first_name text NOT NULL,
        middle_initial text,
        last_name text NOT NULL,
        address_line1 text NOT NULL,
        address_line2 text,
        city text NOT NULL,
        state text NOT NULL,
        zip_code text NOT NULL,
        phone_number text,
        payout_preference text NOT NULL CHECK (payout_preference IN ('paypal', 'venmo', 'check')),
        payout_identifier text,
        created_at timestamp
        with time zone DEFAULT now
        ()
);

        -- Enable Row Level Security (RLS) for the tables
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

        -- Create policies for the 'users' table
        CREATE POLICY "Can view own user data." ON public.users FOR
        SELECT USING (auth.uid() = id);
        CREATE POLICY "Can update own user data." ON public.users FOR
        UPDATE USING (auth.uid()
        = id);

        -- Create policies for the 'settlements' table
        CREATE POLICY "Settlements are viewable by everyone." ON public.settlements FOR
        SELECT USING (true);

        -- Create policies for the 'user_claims' table
        CREATE POLICY "Users can create their own claims." ON public.user_claims FOR
        INSERT WITH CHECK (auth.uid() =
        user_id);
        CREATE POLICY "Users can view their own claims." ON public.user_claims FOR
        SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can update their own claims." ON public.user_claims FOR
        UPDATE USING (auth.uid()
        = user_id);

        -- Policies for user_profiles
        CREATE POLICY "Can view own profile." ON public.user_profiles FOR
        SELECT USING (auth.uid() = id);
        CREATE POLICY "Can update own profile." ON public.user_profiles FOR
        UPDATE USING (auth.uid()
        = id);
        CREATE POLICY "Can insert own profile." ON public.user_profiles FOR
        INSERT WITH CHECK (auth.uid() =
        id);
