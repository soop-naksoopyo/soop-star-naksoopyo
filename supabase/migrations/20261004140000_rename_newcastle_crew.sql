DO $$
DECLARE
  old_crew_id UUID;
  new_crew_id UUID;
BEGIN
  SELECT id INTO old_crew_id FROM public.crews WHERE name = '뉴켓슬';
  SELECT id INTO new_crew_id FROM public.crews WHERE name = '뉴캣슬';

  IF old_crew_id IS NOT NULL AND new_crew_id IS NULL THEN
    UPDATE public.crews SET name = '뉴캣슬' WHERE id = old_crew_id;
  ELSIF old_crew_id IS NOT NULL AND new_crew_id IS NOT NULL THEN
    UPDATE public.streamers SET crew_id = new_crew_id WHERE crew_id = old_crew_id;
    DELETE FROM public.crews WHERE id = old_crew_id;
  END IF;
END $$;
