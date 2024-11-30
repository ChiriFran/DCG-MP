export const pedirDatos = async () => {
  try {
    let url = "https://fakestoreapi.com/products";
    const res = await fetch(url);
    const data = await res.json();

    // Agregar la propiedad "stock" a cada objeto y establecer su valor en 10
    const datosConStock = data.map((objeto) => ({
      ...objeto,
      stock: 10,
    }));

    return datosConStock;
  } catch (error) {
    console.error("Error al obtener los datos:", error);
    throw error;
  }
};

export const pedirItemPorId = async (id) => {
  try {
    const data = await pedirDatos(); // Obtener los datos utilizando la función pedirDatos
    const item = data.find((e) => e.id === id);

    if (item) {
      return item; // Devolver el elemento si se encuentra
    } else {
      throw new Error("No se encontró el producto"); // Lanzar un error si no se encuentra
    }
  } catch (error) {
    console.error("Error al obtener el producto por ID:", error);
    throw error; // Lanzar el error para que sea manejado externamente si es necesario
  }
};

// Función para mezclar los elementos de un array de manera aleatoria
const shuffle = (array) => {
  array.forEach((_, index) => {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  });
  return array;
};

export const pedirDatosDestacados = async () => {
  try {
    // Obtener todos los datos
    const datos = await pedirDatos();

    // Mezclar los datos de manera aleatoria
    const datosMezclados = shuffle(datos);

    // Tomar solo los primeros 4 elementos de la lista
    const cuatroElementos = datosMezclados.slice(0, 4);

    return cuatroElementos;
  } catch (error) {
    console.error("Error al obtener los datos destacados:", error);
    throw error;
  }
};
