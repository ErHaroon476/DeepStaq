-- Create alert_settings table
CREATE TABLE IF NOT EXISTS public.alert_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    godown_id UUID NOT NULL REFERENCES public.godowns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empty_threshold DECIMAL(10,3) DEFAULT 0 NOT NULL,
    low_threshold DECIMAL(10,3) DEFAULT 3 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(godown_id, user_id)
);

-- Create unit_alert_settings table
CREATE TABLE IF NOT EXISTS public.unit_alert_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    godown_id UUID NOT NULL REFERENCES public.godowns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    unit_type_id UUID NOT NULL REFERENCES public.unit_types(id) ON DELETE CASCADE,
    empty_threshold DECIMAL(10,3) DEFAULT 0 NOT NULL,
    low_threshold DECIMAL(10,3) DEFAULT 3 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(godown_id, user_id, unit_type_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alert_settings_godown_user ON public.alert_settings(godown_id, user_id);
CREATE INDEX IF NOT EXISTS idx_unit_alert_settings_godown_user ON public.unit_alert_settings(godown_id, user_id);
CREATE INDEX IF NOT EXISTS idx_unit_alert_settings_unit_type ON public.unit_alert_settings(unit_type_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_alert_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own alert settings" ON public.alert_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert settings" ON public.alert_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert settings" ON public.alert_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert settings" ON public.alert_settings
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own unit alert settings" ON public.unit_alert_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unit alert settings" ON public.unit_alert_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unit alert settings" ON public.unit_alert_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unit alert settings" ON public.unit_alert_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_alert_settings_updated_at
    BEFORE UPDATE ON public.alert_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_unit_alert_settings_updated_at
    BEFORE UPDATE ON public.unit_alert_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
