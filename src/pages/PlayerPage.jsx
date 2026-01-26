import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { Music, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useQueue } from '../hooks/useQueue';
import { useEstablishment } from '../contexts/EstablishmentContext';

// Local Error Boundary for the Player specifically
class PlayerErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("PlayerErrorBoundary caught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
                    <p className="text-red-500 font-bold mb-4">Erro no Player</p>
                    <button
                        onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
                        className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
                    >
                        Recarregar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// Custom Guarded Image Component
const SafeImage = ({ src, alt, className, ...props }) => {
    const [error, setError] = useState(false);
    if (error || !src) return null; // Render nothing if broken
    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setError(true)}
            {...props}
        />
    );
};

export default function PlayerPage() {
    const { nowPlaying, queue, playNext } = useQueue();
    const { establishment } = useEstablishment() || {}; // Safe usage if global player

    // Player State
    const [ready, setReady] = useState(false);
    const [muted, setMuted] = useState(false); // Try to start unmuted
    const [playerState, setPlayerState] = useState(-1);

    // UI State
    const [showControls, setShowControls] = useState(false);
    const [showForceReady, setShowForceReady] = useState(false);

    // Ref to hold the internal YouTube player instance
    const playerRef = useRef(null);

    // Reset state when video changes
    useEffect(() => {
        setReady(false);
        setPlayerState(-1);
        setShowForceReady(false);

        // Fallback: Force ready after 8s to unblock UI
        const timer = setTimeout(() => {
            if (!ready) {
                console.warn("Force Ready triggered due to timeout");
                setReady(true);
            }
        }, 8000);

        return () => clearTimeout(timer);
    }, [nowPlaying?.video_id]);


    // Handle Mute/Unmute via API
    useEffect(() => {
        try {
            if (playerRef.current && ready) {
                if (muted) {
                    playerRef.current.mute?.();
                } else {
                    playerRef.current.unMute?.();
                }
            }
        } catch (e) {
            console.warn("Mute toggle failed", e);
        }
    }, [muted, ready]);


    const requestUrl = establishment
        ? `${window.location.origin}/e/${establishment.slug}/request`
        : `${window.location.origin}/request`;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(requestUrl)}`;

    const onPlayerReady = (event) => {
        console.log('YouTube Player Ready');
        playerRef.current = event.target;
        setReady(true);
        if (muted) event.target.mute?.();
        else event.target.unMute?.();
        event.target.playVideo?.();
    };

    const onPlayerStateChange = (event) => {
        const newState = event.data;
        setPlayerState(newState);
        console.log('Player State Change:', newState);

        if (newState === 0) { // ENDED
            playNext();
        }
    };

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            mute: 0,
            origin: window.location.origin,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            playsinline: 1
        },
    };

    return (
        <div className="relative h-screen w-screen bg-black overflow-hidden flex flex-col font-sans text-white selection:bg-neon-green selection:text-black">
            {nowPlaying ? (
                <>
                    {/* VIDEO AREA */}
                    <div
                        className="flex-1 relative bg-black flex items-center justify-center overflow-hidden"
                        onMouseEnter={() => setShowControls(true)}
                        onMouseLeave={() => setShowControls(false)}
                    >
                        {/* Player Container */}
                        <div className="w-full h-full pointer-events-none">
                            <div className="w-full h-full pointer-events-auto">
                                <PlayerErrorBoundary>
                                    <YouTube
                                        key={nowPlaying.video_id}
                                        videoId={nowPlaying.video_id}
                                        opts={opts}
                                        onReady={onPlayerReady}
                                        onStateChange={onPlayerStateChange}
                                        onError={(e) => console.error('YouTube Error:', e)}
                                        className="w-full h-full"
                                        iframeClassName="w-full h-full object-cover"
                                    />
                                </PlayerErrorBoundary>
                            </div>
                        </div>

                        {/* Unmute / Control Overlay */}
                        {(muted || !ready) && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                                {/* Centered Unmute Prompt */}
                                {ready && muted && (
                                    <button
                                        onClick={() => setMuted(false)}
                                        className="pointer-events-auto bg-black/60 backdrop-blur-md border border-neon-green/50 text-neon-green font-bold py-4 px-8 rounded-full shadow-[0_0_30px_rgba(0,255,65,0.3)] hover:scale-105 hover:bg-neon-green hover:text-black transition-all duration-300 flex items-center gap-3 animate-pulse"
                                    >
                                        <Volume2 className="w-6 h-6" />
                                        ATIVAR SOM
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Loading Overlay */}
                        {(!ready || (playerState === 3 && showForceReady)) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-40">
                                <div className="text-center animate-pulse mb-8">
                                    <div className="w-12 h-12 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-neon-green text-xl font-bold tracking-widest">
                                        {!ready ? 'CARREGANDO PLAYER...' : 'BUFFERING...'}
                                    </p>
                                </div>
                                {showForceReady && (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="mt-4 px-6 py-2 bg-gray-800 border border-white/20 rounded hover:bg-gray-700 transition"
                                    >
                                        <RotateCcw className="inline w-4 h-4 mr-2" />
                                        Recarregar Página
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Volume Indicator & Controls (Top Right) */}
                        <div className={`absolute top-4 right-4 z-40 flex gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                            {/* Skip Button */}
                            <button
                                onClick={playNext}
                                className="pointer-events-auto p-3 rounded-full backdrop-blur-md border border-white/20 bg-black/40 hover:bg-white/10 transition-all duration-300"
                                title="Pular Música"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                            </button>

                            <button
                                onClick={() => setMuted(!muted)}
                                className={`pointer-events-auto p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${muted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-neon-green/20 border-neon-green text-neon-green'}`}
                            >
                                {muted ? <VolumeX /> : <Volume2 />}
                            </button>
                        </div>

                    </div>

                    {/* FOOTER / INFO BAR */}
                    <div className="h-32 bg-[#0f0f0f] border-t border-white/10 flex items-center px-8 justify-between z-20 relative shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                        {/* Current Song Info */}
                        <div className="flex items-center gap-6">
                            {(nowPlaying.thumbnail_url) && (
                                <SafeImage
                                    src={nowPlaying.thumbnail_url}
                                    className="w-20 h-20 object-cover rounded-lg shadow-lg shadow-neon-purple/20 ring-1 ring-white/10"
                                    alt="Album Art"
                                />
                            )}
                            <div className="max-w-md">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent line-clamp-1">
                                    {nowPlaying.title}
                                </h2>
                                <p className="text-neon-green font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    {nowPlaying.channel_title}
                                </p>
                            </div>
                        </div>

                        {/* Up Next & Connect QR */}
                        <div className="flex gap-4 items-center">
                            <div className="text-right hidden lg:block">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Próxima</p>
                                {queue.length > 0 ? (
                                    <p className="font-medium max-w-[200px] truncate text-white">{queue[0].title}</p>
                                ) : (
                                    <p className="text-gray-600 italic text-sm">Fila Vazia</p>
                                )}
                            </div>
                            <div className="bg-white p-2 rounded-lg shadow-lg shadow-neon-green/20">
                                <SafeImage src={qrCodeUrl} className="w-20 h-20" alt="Join QR" />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* IDLE STATE (Empty Queue) */
                <div className="flex-1 flex flex-col items-center justify-center bg-black p-4 relative overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/20 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                    <div className="z-10 text-center space-y-8 p-12 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 max-w-3xl w-full shadow-2xl">
                        <Music className="w-24 h-24 mx-auto text-neon-purple animate-bounce" />

                        <div className="space-y-4">
                            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-neon-green via-white to-neon-purple drop-shadow-sm">
                                Jukebox Party
                            </h1>
                            <p className="text-2xl text-gray-400 font-light">
                                A fila está vazia. Escaneie para pedir uma música!
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl inline-block shadow-[0_0_40px_-10px_rgba(0,255,65,0.4)] transform hover:scale-105 transition duration-500">
                            <SafeImage src={qrCodeUrl} alt="QR Code" className="w-72 h-72 mix-blend-multiply" />
                            <p className="mt-4 text-black font-mono font-bold tracking-[0.2em] text-sm">
                                {requestUrl.replace(/^https?:\/\//, '')}
                            </p>
                        </div>
                    </div>

                    <div className="absolute bottom-8 text-white/20 text-sm font-mono tracking-widest">
                        AGUARDANDO PEDIDOS...
                    </div>
                </div>
            )}
        </div>
    );
}
