import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const EstablishmentContext = createContext();

export function EstablishmentProvider({ children }) {
    const { slug } = useParams();
    const [establishment, setEstablishment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const root = document.documentElement;
        if (establishment?.settings) {
            const s = establishment.settings;
            if (s.theme_primary_color) root.style.setProperty('--theme-primary', s.theme_primary_color);
            if (s.theme_secondary_color) root.style.setProperty('--theme-secondary', s.theme_secondary_color);
            if (s.background_image_url) {
                document.body.style.backgroundImage = `url('${s.background_image_url}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundAttachment = 'fixed';
            }
        }

        return () => {
            root.style.removeProperty('--theme-primary');
            root.style.removeProperty('--theme-secondary');
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundAttachment = '';
        };
    }, [establishment]);

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            return;
        }

        const fetchEstablishment = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('establishments')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error) throw error;
                setEstablishment(data);
            } catch (err) {
                console.error("Error fetching establishment:", err);
                setError(err);
                setEstablishment(null);
            } finally {
                setLoading(false);
            }
        };

        fetchEstablishment();
    }, [slug]);

    return (
        <EstablishmentContext.Provider value={{ establishment, loading, error }}>
            {children}
        </EstablishmentContext.Provider>
    );
}

export const useEstablishment = () => useContext(EstablishmentContext);
