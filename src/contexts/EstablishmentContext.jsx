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
