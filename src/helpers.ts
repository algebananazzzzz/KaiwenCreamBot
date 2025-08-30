export const logStep = (label: string, start: number) => {
    const duration = (performance.now() - start).toFixed(0);
    console.log(`✅ ${label} completed in ${duration} ms`);
};
