UPDATE events
SET state = CASE
                -- If choosen_event_option_id is set and the end time of the chosen event option is not over
                WHEN choosen_event_option_id IS NOT NULL AND (
                    (eo.end_time NOt NULL AND DATETIME(eo.date || ' ' || eo.end_time) > DATETIME('now')) OR
                    (eo.end_time IS NULL AND DATE(event_options.date) = DATE('now'))
                    AND DATETIME(eo.date || ' ' || eo.start_time) < DATETIME('now')
                )
                THEN 2 -- Set state to ACTIVE
                -- If choosen_event_option is set but the event is over
                WHEN choosen_event_option_id IS NOT NULL AND (
                    (eo.end_time NOt NULL AND DATETIME(eo.date || ' ' || eo.end_time) < DATETIME('now')) OR
                    (eo.end_time IS NULL AND DATE(event_options.date) < DATE('now'))
                )
                THEN 3 -- Set state to CLOSED
                ELSE state -- Keep the state unchanged
            END
FROM events
LEFT JOIN event_options as eo ON events.choosen_event_option_id = event_options.id
WHERE events.state IN [1,2];
