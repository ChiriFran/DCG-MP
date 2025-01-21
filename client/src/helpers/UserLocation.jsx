// UserLocation.js
export const getUserLocation = async () => {
    try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        return data.country_name;  // Devuelve el nombre del país
    } catch (error) {
        console.error("Error obtaining location:", error);
        return null;
    }
};
