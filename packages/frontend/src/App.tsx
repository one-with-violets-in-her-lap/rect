function App() {
    function handleStart() {}

    return (
        <>
            <div className="mx-auto max-w-4xl px-6 py-46">
                <h1 className="mb-5 text-6xl font-semibold">Rect</h1>

                <p className="mb-5 text-xl">1v1 shooter game</p>

                <button
                    className="bg-primary text-background hover:bg-primary/80 w-2xs rounded-lg border-2 border-transparent px-8 py-2 text-xl shadow-lg shadow-black/10 transition-all duration-300 hover:scale-105 hover:cursor-pointer active:scale-95 active:shadow-transparent active:duration-100"
                    onClick={handleStart}
                >
                    Start
                </button>
            </div>
        </>
    )
}

export default App
