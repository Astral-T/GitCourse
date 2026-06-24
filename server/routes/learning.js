import express from 'express';
import db from '../db.js';

const router = express.Router();

// Banco de datos estático de datos interesantes y quizzes para los 10 países
const COUNTRY_FACTS = {
  'PER': {
    name: 'Perú',
    Comida: {
      facts: [
        'El Ceviche peruano es el plato bandera, preparado con pescado fresco marinado en jugo de limón, ají y cebolla roja.',
        'La Papa a la Huancaína consiste en papas sancochadas cubiertas por una salsa cremosa a base de queso fresco, ají amarillo y leche.'
      ],
      quiz: [
        { question: '¿Cuál es el ingrediente ácido clave para preparar el ceviche tradicional?', options: ['Vinagre', 'Jugo de limón', 'Naranja agria', 'Mostaza'], answer: 1 },
        { question: '¿Qué tipo de ají le da el color amarillo característico a la salsa huancaína?', options: ['Ají Panca', 'Ají Limo', 'Ají Amarillo', 'Rocoto'], answer: 2 },
        { question: '¿Cuál es el tubérculo originario de los Andes que es ingrediente base de la causa?', options: ['Yuca', 'Papa', 'Camote', 'Olluco'], answer: 1 }
      ]
    },
    Naturaleza: {
      facts: [
        'La Vicuña es el animal nacional del Perú, poseedora de la fibra animal más fina y cara del mundo.',
        'El Parque Nacional del Manu es uno de los lugares con mayor biodiversidad de aves y plantas en todo el planeta.'
      ],
      quiz: [
        { question: '¿Qué animal nacional peruano produce la fibra textil más fina del mundo?', options: ['Guanaco', 'Alpaca', 'Llama', 'Vicuña'], answer: 3 },
        { question: '¿En qué gran región del Perú se encuentra el Parque Nacional del Manu?', options: ['Selva Amazónica', 'Costa Pacífica', 'Sierra Andina', 'Desierto Costero'], answer: 0 },
        { question: '¿Cuál es la flor nacional del Perú, sagrada para los Incas?', options: ['Orquídea', 'Cantuta', 'Flor de Retama', 'Girasol'], answer: 1 }
      ]
    },
    Economía: {
      facts: [
        'Perú es uno de los mayores productores y exportadores de Cobre en el mundo, impulsando su balanza comercial.',
        'La pesquería peruana destaca globalmente por la exportación de harina de pescado basada en la anchoveta.'
      ],
      quiz: [
        { question: '¿Cuál es el principal metal de exportación que lidera la minería en el Perú?', options: ['Oro', 'Cobre', 'Plata', 'Zinc'], answer: 1 },
        { question: '¿Qué especie marina es la base de la gran industria de harina de pescado en el Perú?', options: ['Tiburón', 'Bonito', 'Anchoveta', 'Jurel'], answer: 2 },
        { question: '¿Cuál es la moneda oficial del Perú utilizada en transacciones comerciales?', options: ['Peso', 'Dólar', 'Sol', 'Bolívar'], answer: 2 }
      ]
    },
    Costumbres: {
      facts: [
        'El Inti Raymi o Fiesta del Sol es una ceremonia incaica que se celebra en Cusco cada 24 de junio en el solsticio de invierno.',
        'El Señor de los Milagros es la procesión católica más multitudinaria, tiñendo las calles de Lima de color morado en octubre.'
      ],
      quiz: [
        { question: '¿En qué ciudad histórica del Perú se celebra el Inti Raymi?', options: ['Lima', 'Arequipa', 'Cusco', 'Puno'], answer: 2 },
        { question: '¿Qué color de vestimenta caracteriza a los fieles del Señor de los Milagros?', options: ['Rojo', 'Blanco', 'Verde', 'Morado'], answer: 3 },
        { question: '¿Qué danza tradicional de la costa peruana destaca por el galanteo y el uso de pañuelos?', options: ['Huayno', 'Marinera', 'Festejo', 'Saya'], answer: 1 }
      ]
    },
    Geografía: {
      facts: [
        'El Lago Titicaca es el lago navegable más alto del mundo, situado en el altiplano andino a más de 3800 m.s.n.m.',
        'La Cordillera de los Andes atraviesa longitudinalmente el territorio peruano, creando múltiples microclimas.'
      ],
      quiz: [
        { question: '¿Con qué país comparte Perú la soberanía sobre el Lago Titicaca?', options: ['Ecuador', 'Chile', 'Bolivia', 'Brasil'], answer: 2 },
        { question: '¿Cuál es el pico más alto de la cordillera peruana?', options: ['Huascarán', 'Yerupajá', 'Misti', 'Alpamayo'], answer: 0 },
        { question: '¿Qué desierto cubre gran parte de la costa sur peruana?', options: ['Atacama', 'Sáhara', 'Sechura', 'Gobi'], answer: 2 }
      ]
    }
  },
  'JPN': {
    name: 'Japón',
    Comida: {
      facts: [
        'El Sushi consiste en arroz sazonado con vinagre acompañado de pescado crudo, mariscos u otros ingredientes.',
        'El Ramen es una sopa de fideos japonesa con caldo concentrado de carne o pescado y condimentos como salsa de soja o miso.'
      ],
      quiz: [
        { question: '¿Qué condimento ácido se añade tradicionalmente al arroz del sushi?', options: ['Vinagre de arroz', 'Jugo de limón', 'Salsa de soja', 'Aceite de sésamo'], answer: 0 },
        { question: '¿Cómo se llama la pasta de soja fermentada muy usada en caldos de ramen?', options: ['Wasabi', 'Miso', 'Tofu', 'Mirin'], answer: 1 },
        { question: '¿Cuál es la raíz verde picante que acompaña tradicionalmente al sushi?', options: ['Jengibre', 'Rábano', 'Wasabi', 'Ginseng'], answer: 2 }
      ]
    },
    Naturaleza: {
      facts: [
        'El florecimiento de los cerezos (Sakura) cubre a Japón de un color rosa pálido en primavera, atrayendo visitas del mundo entero.',
        'El Bosque de Bambú de Arashiyama en Kioto ofrece senderos rodeados de imponentes tallos verdes de bambú.'
      ],
      quiz: [
        { question: '¿Cómo se llama en japonés la flor del cerezo?', options: ['Kiku', 'Sakura', 'Ume', 'Momo'], answer: 1 },
        { question: '¿En qué histórica ciudad japonesa se encuentra el famoso bosque de bambú de Arashiyama?', options: ['Tokio', 'Kioto', 'Osaka', 'Hiroshima'], answer: 1 },
        { question: '¿Qué animal habita libremente en el famoso parque de la ciudad de Nara?', options: ['Monos', 'Gatos', 'Ciervos', 'Palomas'], answer: 2 }
      ]
    },
    Economía: {
      facts: [
        'Japón es líder mundial en robótica e industria automotriz, siendo sede de multinacionales de renombre como Toyota e Honda.',
        'El Yen (JPY) es la unidad monetaria de Japón y actúa como una de las principales monedas de reserva a nivel global.'
      ],
      quiz: [
        { question: '¿Cuál es la moneda oficial de Japón?', options: ['Won', 'Yuan', 'Yen', 'Dólar'], answer: 2 },
        { question: '¿En qué sector tecnológico e industrial es Japón un pionero destacado a nivel mundial?', options: ['Aeroespacial', 'Robótica y Automotriz', 'Minería pesada', 'Biocombustibles'], answer: 1 },
        { question: '¿Qué corporación de automóviles japonesa es una de las más grandes del planeta?', options: ['Hyundai', 'Toyota', 'Ford', 'Fiat'], answer: 1 }
      ]
    },
    Costumbres: {
      facts: [
        'La Ceremonia del Té es un ritual tradicional influenciado por el budismo zen para preparar y servir té verde en polvo (matcha).',
        'Las reverencias (ojigi) son la forma habitual de saludarse, disculparse o agradecer en la sociedad japonesa.'
      ],
      quiz: [
        { question: '¿Qué tipo de té verde en polvo se utiliza en la Ceremonia del Té japonesa?', options: ['Sencha', 'Oolong', 'Matcha', 'Chai'], answer: 2 },
        { question: '¿Cómo se llama la vestimenta tradicional japonesa de seda con mangas anchas?', options: ['Kimono', 'Hanbok', 'Sari', 'Kilt'], answer: 0 },
        { question: '¿Qué saludo o gesto físico expresa respeto y es norma social en Japón?', options: ['Apretón de manos', 'Un beso en la mejilla', 'Reverencia', 'Abrazo'], answer: 2 }
      ]
    },
    Geografía: {
      facts: [
        'Japón es un archipiélago volcánico compuesto por más de 6,000 islas, siendo Honshu la isla principal.',
        'El Monte Fuji es un volcán activo y el pico más alto del país, considerado sagrado por los japoneses.'
      ],
      quiz: [
        { question: '¿Cuál es la isla más grande y poblada del archipiélago de Japón?', options: ['Hokkaido', 'Kyushu', 'Shikoku', 'Honshu'], answer: 3 },
        { question: '¿Qué es geográficamente el célebre Monte Fuji?', options: ['Una meseta', 'Un volcán activo', 'Un cañón glaciar', 'Una fosa marina'], answer: 1 },
        { question: '¿Qué océano rodea la costa este de Japón?', options: ['Índico', 'Atlántico', 'Pacífico', 'Ártico'], answer: 2 }
      ]
    }
  },
  'DEU': {
    name: 'Alemania',
    Comida: {
      facts: [
        'El Sauerkraut (chucrut) es col blanca fermentada con sal, acompañante clásico de carnes en la cocina alemana.',
        'La Wurst (salchicha) cuenta con más de 1500 variedades en el país, siendo la Currywurst una de las favoritas de Berlín.'
      ],
      quiz: [
        { question: '¿Qué ingrediente vegetal fermentado compone el tradicional Sauerkraut?', options: ['Cebolla', 'Col blanca', 'Papas', 'Zanahoria'], answer: 1 },
        { question: '¿Qué especia le da el sabor característico a la salsa de la Currywurst?', options: ['Pimienta', 'Orégano', 'Curry', 'Canela'], answer: 2 },
        { question: '¿Qué panecillo salado en forma de lazo entrelazado es típico de Alemania?', options: ['Croissant', 'Pretzel (Brezel)', 'Baguette', 'Pan de molde'], answer: 1 }
      ]
    },
    Naturaleza: {
      facts: [
        'La Selva Negra es una región montañosa densamente arbolada del suroeste, famosa por sus pinos oscuros y leyendas.',
        'Los Alpes Bávaros en el sur ofrecen espectaculares picos nevados y lagos de aguas cristalinas.'
      ],
      quiz: [
        { question: '¿Qué famoso bosque alemán inspiró muchos de los cuentos de los Hermanos Grimm?', options: ['Selva Negra', 'Bosque de Sherwood', 'Taiga bávara', 'Ardenas'], answer: 0 },
        { question: '¿En qué región federada del sur de Alemania se ubican los Alpes Bávaros?', options: ['Hamburgo', 'Sajonia', 'Baviera', 'Berlín'], answer: 2 },
        { question: '¿Qué animal es el ave nacional y símbolo del escudo de Alemania?', options: ['Cigüeña', 'Águila', 'Halcón', 'Búho'], answer: 1 }
      ]
    },
    Economía: {
      facts: [
        'Alemania es la mayor economía de Europa y líder en exportación de maquinaria, automóviles y productos químicos.',
        'Sede de gigantes del desarrollo de software como SAP y marcas de manufactura automotriz como Volkswagen y Mercedes-Benz.'
      ],
      quiz: [
        { question: '¿Cuál es la moneda oficial de curso legal en Alemania?', options: ['Franco', 'Marco', 'Euro', 'Libra'], answer: 2 },
        { question: '¿Qué empresa multinacional alemana es líder global en software ERP?', options: ['Microsoft', 'SAP', 'Oracle', 'Siemens'], answer: 1 },
        { question: '¿Qué industria manufacturera es el principal pilar económico de Alemania?', options: ['Automotriz y Maquinaria', 'Textil barata', 'Minería de cobre', 'Turismo de sol'], answer: 0 }
      ]
    },
    Costumbres: {
      facts: [
        'El Oktoberfest es la fiesta popular más grande del mundo, celebrada en Múnich desde 1810 en honor al matrimonio real.',
        'El Schultüte es un cono de papel gigante lleno de dulces que reciben los niños en su primer día de clases de primaria.'
      ],
      quiz: [
        { question: '¿En qué ciudad alemana se celebra el Oktoberfest original?', options: ['Berlín', 'Fráncfort', 'Múnich', 'Colonia'], answer: 2 },
        { question: '¿Qué regalo tradicional reciben los niños alemanes al entrar a primaria?', options: ['Una bicicleta', 'Un Schultüte con dulces', 'Un libro de ciencias', 'Una mochila de cuero'], answer: 1 },
        { question: '¿Qué festividad invernal cuenta con famosos mercadillos (Weihnachtsmarkt) en todo el país?', options: ['Navidad', 'Semana Santa', 'Halloween', 'Día del Trabajo'], answer: 0 }
      ]
    },
    Geografía: {
      facts: [
        'El Río Rin es una de las vías fluviales más activas del mundo, vital para la industria y rica en castillos históricos.',
        'El territorio alemán limita con nueve países vecinos en el corazón geográfico del continente europeo.'
      ],
      quiz: [
        { question: '¿Qué río histórico atraviesa el oeste de Alemania y es clave para el transporte industrial?', options: ['Río Rin', 'Río Sena', 'Río Támesis', 'Río Nilo'], answer: 0 },
        { question: '¿Con cuántos países limita Alemania en total?', options: ['5', '7', '9', '12'], answer: 2 },
        { question: '¿Qué mar baña las costas del norte de Alemania junto con el Mar Báltico?', options: ['Mar Mediterráneo', 'Mar Rojo', 'Mar del Norte', 'Mar Caspio'], answer: 2 }
      ]
    }
  },
  'EGY': {
    name: 'Egipto',
    Comida: {
      facts: [
        'El Kushari es el plato nacional, que mezcla arroz, lentejas, pasta, garbanzos y cebolla frita con salsa de tomate picante y ajo.',
        'El Ful Medames es un guiso puré de habas cocidas a fuego lento, aderezado con aceite de oliva, ajo y limón, consumido en el desayuno.'
      ],
      quiz: [
        { question: '¿Qué ingredientes componen la base del plato egipcio Kushari?', options: ['Pollo y cuscús', 'Pescado y arroz', 'Arroz, lentejas, pasta y garbanzos', 'Carne de cordero y yogur'], answer: 2 },
        { question: '¿Qué legumbre es el ingrediente principal del Ful Medames?', options: ['Habas', 'Lentejas', 'Frijoles negros', 'Gisantes'], answer: 0 },
        { question: '¿Qué pan plano y esponjoso acompaña casi todas las comidas en Egipto?', options: ['Pretzel', 'Aish Baladi (pan de pita)', 'Tortilla', 'Baguette'], answer: 1 }
      ]
    },
    Naturaleza: {
      facts: [
        'El Desierto del Sáhara cubre más del 90% del territorio egipcio, con dunas imponentes y llanuras áridas de arena.',
        'El Oasis de Siwa en el desierto occidental destaca por sus palmerales de dátiles, olivos y manantiales de agua natural.'
      ],
      quiz: [
        { question: '¿Qué gran desierto cubre la gran mayoría del territorio de Egipto?', options: ['Gobi', 'Sáhara', 'Atacama', 'Kalahari'], answer: 1 },
        { question: '¿Qué cultivo frutal es sumamente abundante en el Oasis de Siwa?', options: ['Manzanas', 'Uvas', 'Dátiles y Olivos', 'Naranjas'], answer: 2 },
        { question: '¿Qué reptil gigante habita en las aguas del sur del río Nilo?', options: ['Iguana', 'Caimán de anteojos', 'Cocodrilo del Nilo', 'Lagarto monitor'], answer: 2 }
      ]
    },
    Economía: {
      facts: [
        'El Canal de Suez es una de las rutas marítimas más importantes del comercio global, uniendo Europa con Asia.',
        'El turismo arqueológico centrado en las pirámides y templos de los faraones es una de las mayores fuentes de divisas.'
      ],
      quiz: [
        { question: '¿Qué canal artificial en Egipto une el mar Mediterráneo con el mar Rojo?', options: ['Canal de Panamá', 'Canal de Suez', 'Canal de Corinto', 'Canal de Kiel'], answer: 1 },
        { question: '¿Cuál es el motor económico turístico clave de Egipto?', options: ['Esquí de nieve', 'Turismo arqueológico (faraónico)', 'Ecoturismo de selva', 'Turismo de casinos'], answer: 1 },
        { question: '¿Cuál es la moneda oficial de Egipto?', options: ['Dinar', 'Libra egipcia', 'Rial', 'Dirham'], answer: 1 }
      ]
    },
    Costumbres: {
      facts: [
        'El Ramadán es un mes sagrado de ayuno diurno donde las familias se reúnen al anochecer para el Iftar (romper el ayuno).',
        'Ofrecer té de menta o café turco como muestra de bienvenida es una arraigada costumbre de hospitalidad egipcia.'
      ],
      quiz: [
        { question: '¿Cómo se llama la cena familiar con la que se rompe el ayuno diario en Ramadán?', options: ['Suhur', 'Iftar', 'Brunch', 'Fiesta de té'], answer: 1 },
        { question: '¿Qué bebida caliente dulce se ofrece tradicionalmente como gesto de hospitalidad?', options: ['Chocolate', 'Té de menta', 'Mate', 'Sake'], answer: 1 },
        { question: '¿Qué instrumento de viento o percusión folclórica es común en la música tradicional egipcia?', options: ['Gaita', 'Darabuka (tambor de copa)', 'Sitar', 'Marimba'], answer: 1 }
      ]
    },
    Geografía: {
      facts: [
        'El Río Nilo cruza Egipto de sur a norte, proveyendo agua dulce y tierras fértiles en un valle rodeado de desierto.',
        'La Península del Sinaí conecta geográficamente el noreste de África con el continente asiático.'
      ],
      quiz: [
        { question: '¿Hacia qué mar fluye el río Nilo al desembocar en el norte de Egipto?', options: ['Mar Rojo', 'Mar Muerto', 'Mar Mediterráneo', 'Mar Negro'], answer: 2 },
        { question: '¿Qué península egipcia sirve de puente terrestre entre África y Asia?', options: ['Península del Sinaí', 'Península Ibérica', 'Península de Anatolia', 'Península Arábiga'], answer: 0 },
        { question: '¿Qué ciudad es la capital y metrópolis más poblada de Egipto?', options: ['Alejandría', 'El Cairo', 'Luxor', 'Giza'], answer: 1 }
      ]
    }
  },
  'BRA': {
    name: 'Brasil',
    Comida: {
      facts: [
        'La Feijoada es el guiso nacional hecho de frijoles negros cocidos con carnes de cerdo, tocino y embutidos, servido con arroz y farofa.',
        'El Pão de Queijo es un panecillo horneado crujiente por fuera y elástico por dentro elaborado con fécula de mandioca y queso.'
      ],
      quiz: [
        { question: '¿Qué tipo de frijoles se emplean para cocinar la Feijoada brasileña?', options: ['Frijoles blancos', 'Frijoles negros', 'Lentejas', 'Garbanzos'], answer: 1 },
        { question: '¿Qué ingrediente harinoso le da textura elástica al Pão de Queijo?', options: ['Fécula de mandioca (yuca)', 'Harina de trigo', 'Maicena', 'Harina de avena'], answer: 0 },
        { question: '¿Qué postre dulce de chocolate condensado en forma de bolita es clásico en los cumpleaños brasileños?', options: ['Tarta de manzana', 'Brigadeiro', 'Alfajor', 'Tiramisú'], answer: 1 }
      ]
    },
    Naturaleza: {
      facts: [
        'La Selva Amazónica cubre más del 50% de Brasil, albergando la cuenca hidrográfica y bosque tropical más grande del mundo.',
        'Las Cataratas del Iguazú en la frontera sur son un colosal sistema de más de 270 saltos de agua rodeados de selva.'
      ],
      quiz: [
        { question: '¿Qué selva tropical cubre la mayor porción del norte de Brasil?', options: ['Selva de las Yungas', 'Selva Amazónica', 'Bosque del Congo', 'Taiga'], answer: 1 },
        { question: '¿Con qué país comparte Brasil el colosal espectáculo de las Cataratas del Iguazú?', options: ['Perú', 'Bolivia', 'Argentina', 'Uruguay'], answer: 2 },
        { question: '¿Qué felino manchado es el mayor depredador de la Amazonía brasileña?', options: ['León', 'Tigre', 'Jaguar (Yaguareté)', 'Guepardo'], answer: 2 }
      ]
    },
    Economía: {
      facts: [
        'Brasil es el mayor productor y exportador mundial de Café, caña de azúcar y soja, liderando el agronegocio regional.',
        'Embraer, una firma brasileña, es uno de los mayores fabricantes de aviones comerciales y militares del planeta.'
      ],
      quiz: [
        { question: '¿De qué producto agrícola básico de las mañanas es Brasil el mayor exportador del mundo?', options: ['Té verde', 'Café', 'Trigo', 'Cebada'], answer: 1 },
        { question: '¿Qué gran fabricante de aviones de pasajeros tiene su sede y producción en Brasil?', options: ['Boeing', 'Airbus', 'Embraer', 'Bombardier'], answer: 2 },
        { question: '¿Cuál es la moneda oficial de curso legal en Brasil?', options: ['Peso', 'Real brasileño', 'Cruzado', 'Bolívar'], answer: 1 }
      ]
    },
    Costumbres: {
      facts: [
        'El Carnaval de Río de Janeiro destaca por sus desfiles monumentales en el Sambódromo, música samba y trajes vibrantes.',
        'La Capoeira es un arte marcial afrobrasileño que combina danza, acrobacias y música tradicional del berimbau.'
      ],
      quiz: [
        { question: '¿En qué famoso recinto urbano desfilan las escuelas de Samba en Río?', options: ['Estadio Maracaná', 'Sambódromo', 'Plaza de Mayo', 'Avenida Paulista'], answer: 1 },
        { question: '¿Qué arte afrobrasileño combina la danza rítmica con defensa personal acrobática?', options: ['Salsa', 'Capoeira', 'Tango', 'Karate'], answer: 1 },
        { question: '¿Qué instrumento de cuerda y arco de madera es el alma musical de la capoeira?', options: ['Guitarra', 'Berimbau', 'Violín', 'Charango'], answer: 1 }
      ]
    },
    Geografía: {
      facts: [
        'El Río Amazonas es el más caudaloso y largo del mundo, fluyendo a través de la cuenca amazónica brasileña.',
        'El territorio brasileño es el más extenso de América del Sur y limita con casi todos los países de la región.'
      ],
      quiz: [
        { question: '¿Qué río sudamericano destaca como el más largo y caudaloso del mundo entero?', options: ['Río Paraná', 'Río de la Plata', 'Río Amazonas', 'Río Orinoco'], answer: 2 },
        { question: '¿Con qué países sudamericanos NO limita geográficamente Brasil?', options: ['Ecuador y Chile', 'Perú y Colombia', 'Argentina y Uruguay', 'Bolivia y Paraguay'], answer: 0 },
        { question: '¿Qué ciudad costera albergó la capital de Brasil antes de mudarse a Brasilia?', options: ['São Paulo', 'Río de Janeiro', 'Salvador de Bahía', 'Manaos'], answer: 1 }
      ]
    }
  },
  'USA': {
    name: 'Estados Unidos',
    Comida: {
      facts: [
        'La Hamburguesa es un ícono gastronómico global, consistente en carne picada cocinada a la parrilla servida en un pan.',
        'El Apple Pie (tarta de manzana) es un postre tradicional de masa horneada rellena de manzanas condimentadas con canela.'
      ],
      quiz: [
        { question: '¿Qué especia aromática dulce acompaña tradicionalmente al relleno de manzanas del Apple Pie?', options: ['Clavo de olor', 'Canela', 'Pimienta', 'Ajo en polvo'], answer: 1 },
        { question: '¿Qué ciudad estadounidense es famosa por crear la Pizza estilo "Deep Dish" de masa gruesa?', options: ['Nueva York', 'Miami', 'Chicago', 'Los Ángeles'], answer: 2 },
        { question: '¿Qué embutido cocido en pan es el bocadillo estrella de los estadios de béisbol?', options: ['Hamburguesa', 'Currywurst', 'Hot Dog (Perro Caliente)', 'Baguette'], answer: 2 }
      ]
    },
    Naturaleza: {
      facts: [
        'El Gran Cañón del Colorado en Arizona es una inmensa garganta excavada por el río Colorado durante millones de años.',
        'El Parque Nacional de Yellowstone es famoso por su actividad geotérmica, geiseres como el Old Faithful y osos grizzly.'
      ],
      quiz: [
        { question: '¿Qué río excavó el imponente relieve del Gran Cañón en Arizona?', options: ['Río Mississippi', 'Río Colorado', 'Río Hudson', 'Río Amazonas'], answer: 1 },
        { question: '¿Cuál es el parque nacional más antiguo del país, famoso por sus géiseres y osos?', options: ['Yosemite', 'Yellowstone', 'Gran Cañón', 'Everglades'], answer: 1 },
        { question: '¿Qué árbol gigante, el más voluminoso del mundo, crece en los bosques templados de California?', options: ['Pino silvestre', 'Roble blanco', 'Secuoya gigante', 'Eucalipto'], answer: 2 }
      ]
    },
    Economía: {
      facts: [
        'Silicon Valley en California es el epicentro mundial de las empresas de tecnología, albergando firmas como Apple y Google.',
        'Wall Street en Nueva York es el mayor mercado bursátil y financiero del mundo, liderando los índices bursátiles globales.'
      ],
      quiz: [
        { question: '¿Qué región de California concentra las principales multinacionales de software e internet?', options: ['Silicon Valley', 'Valle de la Muerte', 'Long Beach', 'Valle de Napa'], answer: 0 },
        { question: '¿En qué histórica calle de Nueva York se encuentra la bolsa de valores más grande del mundo?', options: ['Broadway', 'Quinta Avenida', 'Wall Street', 'Madison Avenue'], answer: 2 },
        { question: '¿Cuál es la moneda oficial de Estados Unidos y divisa de reserva global?', options: ['Euro', 'Yen', 'Libra', 'Dólar (USD)'], answer: 3 }
      ]
    },
    Costumbres: {
      facts: [
        'El Día de Acción de Gracias (Thanksgiving) se celebra en noviembre compartiendo una cena familiar centrada en pavo asado.',
        'El 4 de Julio conmemora el Día de la Independencia con desfiles, conciertos patrióticos y espectáculos de fuegos artificiales.'
      ],
      quiz: [
        { question: '¿Qué plato asado entero es el centro culinario del Día de Acción de Gracias?', options: ['Lechón', 'Pollo', 'Pavo', 'Pato'], answer: 2 },
        { question: '¿Qué fecha conmemora el Día de la Independencia de los Estados Unidos?', options: ['4 de Julio', '25 de Diciembre', '12 de Octubre', '1 de Enero'], answer: 0 },
        { question: '¿Qué fiesta infantil de disfraces y dulces se celebra la noche del 31 de octubre?', options: ['Navidad', 'Halloween', 'Pascua', 'Día de Reyes'], answer: 1 }
      ]
    },
    Geografía: {
      facts: [
        'El Río Mississippi es el sistema fluvial más largo de Norteamérica, conectando el norte del país con el Golfo de México.',
        'Las Montañas Rocosas (Rocky Mountains) forman una masiva cordillera que corre de norte a sur por el oeste americano.'
      ],
      quiz: [
        { question: '¿Hacia qué golfo desembocan las aguas del gran río Mississippi?', options: ['Golfo de California', 'Golfo de México', 'Golfo de Vizcaya', 'Golfo Pérsico'], answer: 1 },
        { question: '¿Qué cordillera montañosa cruza longitudinalmente el oeste de Estados Unidos y Canadá?', options: ['Montes Apalaches', 'Montañas Rocosas', 'Los Andes', 'Los Alpes'], answer: 1 },
        { question: '¿Qué estado del país es un archipiélago situado en medio del océano Pacífico?', options: ['Florida', 'Alaska', 'Hawái', 'California'], answer: 2 }
      ]
    }
  },
  'FRA': {
    name: 'Francia',
    Comida: {
      facts: [
        'El Croissant es un bollo hojaldrado con forma de media luna elaborado con mantequilla y levadura.',
        'El Ratatouille es un guiso provenzal de verduras que incluye berenjenas, calabacines, pimientos, tomates, cebollas y ajo.'
      ],
      quiz: [
        { question: '¿Qué ingrediente le da la textura hojaldrada y sabor graso al Croissant?', options: ['Aceite de oliva', 'Mantequilla', 'Manteca de cerdo', 'Yogur'], answer: 1 },
        { question: '¿De qué histórica región francesa proviene la receta tradicional del Ratatouille?', options: ['Bretaña', 'Normandía', 'Provenza (sur)', 'Alsacia'], answer: 2 },
        { question: '¿Qué hongo subterráneo de aroma intenso y muy cotizado es una joya de la cocina francesa?', options: ['Champiñón', 'Trufa negra', 'Seta portobello', 'Shiitake'], answer: 1 }
      ]
    },
    Naturaleza: {
      facts: [
        'Los campos de Lavanda en Provenza florecen en verano cubriendo el paisaje de un color violeta intenso y fragancia dulce.',
        'El Mont Blanc en los Alpes es la montaña más alta de Europa occidental, cubierta de glaciares perpetuos.'
      ],
      quiz: [
        { question: '¿Qué cultivo tiñe de violeta los paisajes provenzales en verano?', options: ['Trigo', 'Girasoles', 'Lavanda', 'Olivos'], answer: 2 },
        { question: '¿Cuál es el pico más alto de los Alpes y de Europa Occidental?', options: ['Mont Blanc', 'Elbrús', 'Matterhorn', 'Monte Rosa'], answer: 0 },
        { question: '¿Qué río atraviesa la capital, París, sirviendo de eje turístico?', options: ['Río Loira', 'Río Sena', 'Río Garona', 'Río Rin'], answer: 1 }
      ]
    },
    Economía: {
      facts: [
        'Francia es el líder global en la industria del lujo y moda premium, con firmas multinacionales como LVMH (Louis Vuitton).',
        'Destaca por su producción y exportación agrícola de vinos finos, champán y quesos con denominación de origen protegida.'
      ],
      quiz: [
        { question: '¿Qué conglomerado multinacional francés es el líder mundial en marcas de lujo?', options: ['LVMH', 'Zara', 'Toyota', 'Apple'], answer: 0 },
        { question: '¿Qué bebida espumosa francesa tiene protección estricta de denominación de origen de su región homónima?', options: ['Vino tinto', 'Champán (Champagne)', 'Cerveza Lager', 'Sidra'], answer: 1 },
        { question: '¿Cuál es la moneda que utiliza Francia hoy en día?', options: ['Franco francés', 'Libra', 'Euro', 'Dólar'], answer: 2 }
      ]
    },
    Costumbres: {
      facts: [
        'La Bise es la costumbre tradicional de saludarse rozando las mejillas y haciendo el sonido de un beso, común entre amigos.',
        'El Día de la Bastilla (14 de julio) es la fiesta nacional, celebrada con un imponente desfile militar en los Campos Elíseos.'
      ],
      quiz: [
        { question: '¿Cómo llaman los franceses al saludo tradicional de rozar mejillas dando besos?', options: ['Le Hug', 'La Bise', 'Le Salu', 'L\'Ojigi'], answer: 1 },
        { question: '¿Qué suceso histórico se conmemora en la fiesta nacional del 14 de julio?', options: ['La coronación de Napoleón', 'La toma de la Bastilla', 'El fin de la Segunda Guerra', 'La firma de la constitución'], answer: 1 },
        { question: '¿Qué pan largo y estrecho se compra diariamente fresco y es símbolo cotidiano francés?', options: ['Croissant', 'Baguette', 'Brioche', 'Pan pita'], answer: 1 }
      ]
    },
    Geografía: {
      facts: [
        'El Río Loira es el más largo de Francia, famoso por su valle rodeado de majestuosos castillos renacentistas.',
        'La península de Bretaña en el oeste presenta una costa rocosa escarpada frente al océano Atlántico.'
      ],
      quiz: [
        { question: '¿Qué valle fluvial francés es mundialmente famoso por sus castillos del Renacimiento?', options: ['Valle del Sena', 'Valle del Loira', 'Valle del Rin', 'Valle del Ródano'], answer: 1 },
        { question: '¿Qué masa de agua separa el norte de Francia del sur de Gran Bretaña?', options: ['Mar Mediterráneo', 'Canal de la Mancha', 'Mar del Norte', 'Mar de Irlanda'], answer: 1 },
        { question: '¿Cuál es la capital histórica y cultural de Francia?', options: ['Marsella', 'Lyon', 'Niza', 'París'], answer: 3 }
      ]
    }
  },
  'IND': {
    name: 'India',
    Comida: {
      facts: [
        'El Curry es un conjunto complejo de guisos especiados con condimentos como cúrcuma, comino, jengibre y chile.',
        'El Biryani es un plato aromático de arroz basmati cocinado con especias, azafrán y carne de pollo, cordero o verduras.'
      ],
      quiz: [
        { question: '¿Qué raíz seca de color amarillo brillante es especia base en los curries indios?', options: ['Ajo', 'Cúrcuma', 'Canela', 'Pimienta negra'], answer: 1 },
        { question: '¿Qué variedad de arroz aromático de grano largo se utiliza para cocinar el Biryani?', options: ['Arroz arborio', 'Arroz glutinoso', 'Arroz basmati', 'Arroz integral'], answer: 2 },
        { question: '¿Qué pan plano indio, horneado en un horno de barro tandoor, acompaña los guisos?', options: ['Tortilla', 'Naan', 'Pretzel', 'Croissant'], answer: 1 }
      ]
    },
    Naturaleza: {
      facts: [
        'El Tigre de Bengala es el depredador nacional de la India, habitando reservas boscosas y manglares de los Sundarbans.',
        'El Río Ganges es una de las cuencas fluviales más grandes, sagrado en el hinduismo y hogar del delfín del Ganges.'
      ],
      quiz: [
        { question: '¿Cuál es el felino nacional y símbolo de conservación de la vida silvestre en la India?', options: ['León asiático', 'Leopardo de las nieves', 'Tigre de Bengala', 'Guepardo'], answer: 2 },
        { question: '¿Qué río de la India es considerado sagrado y purificador en la religión hinduista?', options: ['Río Ganges', 'Río Indo', 'Río Nilo', 'Río Yangtsé'], answer: 0 },
        { question: '¿Qué cordillera del norte de la India alberga los picos más elevados de la Tierra?', options: ['Los Andes', 'Los Alpes', 'El Himalaya', 'Los Urales'], answer: 2 }
      ]
    },
    Economía: {
      facts: [
        'India es una superpotencia global en servicios de tecnologías de la información (IT) y consultoría de software (outsourcing).',
        'Es el mayor fabricante de medicamentos genéricos a nivel mundial, abasteciendo a mercados en desarrollo y avanzados.'
      ],
      quiz: [
        { question: '¿En qué sector tecnológico destaca India globalmente por servicios de outsourcing y soporte corporativo?', options: ['Manufactura de chips', 'Tecnologías de la Información (IT)', 'Industria aeroespacial', 'Refinación de petróleo'], answer: 1 },
        { question: '¿En qué tipo de producción farmacéutica a gran escala destaca la economía de la India?', options: ['Medicamentos biológicos patentados', 'Fórmulas homeopáticas', 'Medicamentos genéricos a bajo costo', 'Vacunas animales únicamente'], answer: 2 },
        { question: '¿Cuál es la moneda oficial de la India?', options: ['Rupia', 'Taka', 'Rial', 'Yuan'], answer: 0 }
      ]
    },
    Costumbres: {
      facts: [
        'El Diwali es el festival de las luces, que celebra el triunfo de la luz sobre la oscuridad encendiendo lámparas de arcilla (diyas).',
        'El Holi es el festival del color y la primavera, donde las personas se lanzan polvos de colores brillantes (gulal).'
      ],
      quiz: [
        { question: '¿Qué festival indio celebra el triunfo del bien sobre el mal encendiendo luces y velas en las casas?', options: ['Holi', 'Diwali', 'Ramadán', 'Inti Raymi'], answer: 1 },
        { question: '¿En qué festival se lanzan polvos de colores brillantes celebrando la primavera?', options: ['Diwali', 'Holi', 'Eid', 'Navratri'], answer: 1 },
        { question: '¿Qué saludo respetuoso se realiza uniendo las palmas de las manos frente al pecho inclinándose levemente?', options: ['Arez', 'Namasté', 'Salaam', 'Shalom'], answer: 1 }
      ]
    },
    Geografía: {
      facts: [
        'El Himalaya forma la frontera norte de la India, conteniendo algunas de las montañas más altas de la Tierra.',
        'El Desierto de Thar en el noroeste es una gran región de dunas áridas que cubre gran parte del estado de Rajastán.'
      ],
      quiz: [
        { question: '¿Qué desierto arenoso y árido se encuentra en el noroeste de la India?', options: ['Sáhara', 'Atacama', 'Desierto de Thar', 'Gobi'], answer: 2 },
        { question: '¿Qué océano baña toda la costa sur de la península de la India?', options: ['Océano Atlántico', 'Océano Pacífico', 'Océano Índico', 'Océano Ártico'], answer: 2 },
        { question: '¿Qué famosa estructura monumental de mármol blanco, maravilla del mundo, se ubica en Agra?', options: ['El Taj Mahal', 'El Coliseo', 'Petra', 'Chichén Itzá'], answer: 0 }
      ]
    }
  },
  'ZAF': {
    name: 'Sudáfrica',
    Comida: {
      facts: [
        'El Biltong es una carne curada y seca en tiras condimentada con cilantro, vinagre y sal, snack nacional de Sudáfrica.',
        'El Bobotie es un plato horneado de carne picada especiada con pasas y curry, cubierto con una capa cremosa de huevo y leche.'
      ],
      quiz: [
        { question: '¿Qué es el tradicional Biltong sudafricano?', options: ['Una sopa de pescado', 'Tiras de carne curada y seca', 'Un postre de coco', 'Un pan de maíz'], answer: 1 },
        { question: '¿Qué aderezo aromático y dulce caracteriza al Bobotie de carne?', options: ['Salsa barbacoa', 'Curry, especias y pasas de uva', 'Salsa de soja y jengibre', 'Queso azul fundido'], answer: 1 },
        { question: '¿Qué embutido tradicional en forma de espiral es protagonista del asado sudafricano?', options: ['Chorizo', 'Boerewors', 'Salchicha de Viena', 'Currywurst'], answer: 1 }
      ]
    },
    Naturaleza: {
      facts: [
        'El Parque Nacional Kruger es una de las reservas de caza más grandes de África, famosa por los "Cinco Grandes" mamíferos.',
        'Table Mountain es una montaña de cima plana que domina el paisaje de Ciudad del Cabo, rica en plantas endémicas.'
      ],
      quiz: [
        { question: '¿Qué famosa reserva nacional sudafricana es hogar de los "Cinco Grandes" mamíferos?', options: ['Parque Nacional del Manu', 'Parque Kruger', 'Parque de Yellowstone', 'Serengueti'], answer: 1 },
        { question: '¿Qué montaña de cima plana corona el paisaje de Ciudad del Cabo?', options: ['Mont Blanc', 'Monte Fuji', 'Table Mountain (Montaña de la Mesa)', 'Kilimanjaro'], answer: 2 },
        { question: '¿Qué pingüino habita en colonias en la costa sudafricana de Boulders Beach?', options: ['Pingüino Emperador', 'Pingüino de El Cabo (africano)', 'Pingüino de Humboldt', 'Pingüino de Adelia'], answer: 1 }
      ]
    },
    Economía: {
      facts: [
        'Sudáfrica es uno de los líderes mundiales en la extracción y exportación de metales preciosos como el Platino y el Oro.',
        'El Rand (ZAR) es la moneda de curso legal del país, clave en las transacciones del continente africano.'
      ],
      quiz: [
        { question: '¿Qué metales preciosos exporta Sudáfrica a nivel mundial liderando los mercados?', options: ['Hierro y Cobre', 'Platino y Oro', 'Litio y Aluminio', 'Estaño y Zinc'], answer: 1 },
        { question: '¿Cuál es la moneda oficial de Sudáfrica?', options: ['Dólar', 'Rand', 'Dinar', 'Libra'], answer: 1 },
        { question: '¿Qué ciudad es el motor financiero e histórico de la minería de oro en Sudáfrica?', options: ['Ciudad del Cabo', 'Pretoria', 'Johannesburgo', 'Durban'], answer: 2 }
      ]
    },
    Costumbres: {
      facts: [
        'El Braai es la tradición sudafricana de hacer barbacoas al aire libre, un evento social vital que reúne a amigos y familias.',
        'Sudáfrica es apodada la "Nación del Arco Iris" por su diversidad de culturas y sus 11 idiomas oficiales.'
      ],
      quiz: [
        { question: '¿Cómo se le conoce popularmente al asado o barbacoa social en Sudáfrica?', options: ['Oktoberfest', 'Braai', 'Thanksgiving', 'Holi'], answer: 1 },
        { question: '¿Qué apodo describe la rica diversidad multicultural y lingüística de Sudáfrica?', options: ['Nación de la Selva', 'Nación de la Plata', 'Nación del Arco Iris', 'País de las Islas'], answer: 2 },
        { question: '¿Quién fue el histórico líder y presidente que luchó contra el Apartheid y unificó al país?', options: ['Mahatma Gandhi', 'Nelson Mandela', 'Pedro Paulet', 'Albert Einstein'], answer: 1 }
      ]
    },
    Geografía: {
      facts: [
        'El Gran Escarpe es una masiva formación geológica que bordea la meseta central sudafricana.',
        'El Cabo de Buena Esperanza es una península rocosa en el sur, históricamente estratégica para las rutas marítimas.'
      ],
      quiz: [
        { question: '¿Qué cabo rocoso histórico en el extremo sur del país unía las rutas a las Indias?', options: ['Cabo de la Vela', 'Cabo de Buena Esperanza', 'Cabo de Hornos', 'Cabo Cod'], answer: 1 },
        { question: '¿Cuántas capitales oficiales tiene Sudáfrica para sus distintos poderes?', options: ['1', '2', '3', '4'], answer: 2 },
        { question: '¿Qué país independiente es un enclave completamente rodeado por el territorio de Sudáfrica?', options: ['Lesoto', 'Kenia', 'Egipto', 'Madagascar'], answer: 0 }
      ]
    }
  },
  'AUS': {
    name: 'Australia',
    Comida: {
      facts: [
        'La Meat Pie es un pastel de hojaldre del tamaño de una mano relleno de carne picada y salsa de carne picante.',
        'El Vegemite es una pasta para untar de color marrón oscuro y sabor salado elaborado a base de extracto de levadura.'
      ],
      quiz: [
        { question: '¿De qué sabor es la famosa pasta nacional Vegemite usada para untar tostadas?', options: ['Dulce de chocolate', 'Frutal de fresa', 'Salado y concentrado de levadura', 'Picante de ají limo'], answer: 2 },
        { question: '¿Qué bocadillo de hojaldre individual relleno de carne picada es un clásico australiano?', options: ['Meat Pie (Pastel de carne)', 'Pretzel', 'Croissant de chocolate', 'Empanada de queso'], answer: 0 },
        { question: '¿Qué postre de merengue cubierto de frutas frescas reclama Australia como propio?', options: ['Tarta de manzana', 'Pavlova', 'Tiramisú', 'Brigadeiro'], answer: 1 }
      ]
    },
    Naturaleza: {
      facts: [
        'La Gran Barrera de Coral es el mayor arrecife de coral del mundo, visible desde el espacio en el mar del Coral.',
        'Australia posee una fauna única dominada por marsupiales endémicos como los Canguros, Koalas y Wombats.'
      ],
      quiz: [
        { question: '¿Cuál es el arrecife de coral más grande del mundo ubicado al noreste de Australia?', options: ['Arrecife de Belice', 'Gran Barrera de Coral', 'Atolón de las Maldivas', 'Arrecife de coral rojo'], answer: 1 },
        { question: '¿Qué animal marsupial saltador es el símbolo nacional de Australia?', options: ['Koala', 'Canguro', 'Ornitorrinco', 'Demonio de Tasmania'], answer: 1 },
        { question: '¿Qué mamífero semiacuático ovíparo venenoso es endémico de Australia?', options: ['Cocodrilo', 'Castor', 'Ornitorrinco', 'Foca monje'], answer: 2 }
      ]
    },
    Economía: {
      facts: [
        'Australia es uno de los mayores exportadores globales de Carbón, mineral de Hierro y gas natural licuado.',
        'El Dólar Australiano (AUD) es su moneda oficial y se ubica entre las monedas más negociadas del mercado cambiario.'
      ],
      quiz: [
        { question: '¿Qué minerales lideran las gigantescas exportaciones mineras de Australia?', options: ['Cobre y Oro', 'Carbón y mineral de Hierro', 'Plata y Zinc', 'Litio y Cobre'], answer: 1 },
        { question: '¿Cuál es la moneda oficial de Australia?', options: ['Libra esterlina', 'Rand', 'Dólar Australiano', 'Dólar de EE.UU.'], answer: 2 },
        { question: '¿Qué sector del agronegocio australiano destaca mundialmente por su exportación textil y cárnica?', options: ['Soya', 'Lana y carne Ovina', 'Trigo transgénico', 'Café robusta'], answer: 1 }
      ]
    },
    Costumbres: {
      facts: [
        'El Día de Australia (26 de enero) celebra el establecimiento del primer asentamiento europeo en Port Jackson.',
        'La cultura de barbacoas al aire libre (barbie) y actividades de surf y playa definen el estilo de vida australiano.'
      ],
      quiz: [
        { question: '¿En qué fecha se celebra anualmente el Día de Australia?', options: ['4 de Julio', '14 de Julio', '26 de Enero', '24 de Junio'], answer: 2 },
        { question: '¿Qué deporte acuático de deslizamiento sobre olas es una pasión nacional en Australia?', options: ['Surf', 'Esquí acuático', 'Kayak de río', 'Waterpolo'], answer: 0 },
        { question: '¿Qué término coloquial usan los australianos para referirse a una barbacoa o asado?', options: ['Braai', 'Barbie', 'Oktoberfest', 'Grill-out'], answer: 1 }
      ]
    },
    Geografía: {
      facts: [
        'El Outback es el inmenso interior semiárido y desértico que cubre la mayor parte del continente australiano.',
        'Uluru (Ayers Rock) es un gigantesco monolito de arenisca roja sagrado para los aborígenes en el centro del país.'
      ],
      quiz: [
        { question: '¿Cómo se le conoce popularmente al vasto interior desértico y árido de Australia?', options: ['La Pampa', 'El Outback', 'La Selva', 'El Altiplano'], answer: 1 },
        { question: '¿Qué gran monolito de arenisca roja sagrado para los indígenas se ubica en el centro de Australia?', options: ['Monte Fuji', 'Uluru', 'Gran Cañón', 'Table Mountain'], answer: 1 },
        { question: '¿Cuál es la ciudad capital de Australia, planificada para resolver la rivalidad de Sídney y Melbourne?', options: ['Sídney', 'Canberra', 'Melbourne', 'Brisbane'], answer: 1 }
      ]
    }
  }
};

// GET /api/learning/facts - Obtiene datos didácticos y preguntas de quiz de un país y categoría
router.get('/facts', async (req, res) => {
  const { country, category } = req.query;

  if (!country || !category) {
    return res.status(400).json({ error: 'Faltan parámetros country y category' });
  }

  const countryData = COUNTRY_FACTS[country];
  if (!countryData || !countryData[category]) {
    return res.status(404).json({ error: 'País o categoría no soportados en la simulación' });
  }

  res.json({
    countryCode: country,
    countryName: countryData.name,
    category,
    facts: countryData[category].facts,
    quiz: countryData[category].quiz
  });
});

// POST /api/learning/quiz-submit - Envía y evalúa las respuestas de un mini-quiz
router.post('/quiz-submit', async (req, res) => {
  const { countryCode, category, answers } = req.body;

  if (!countryCode || !category || !answers || !Array.isArray(answers) || answers.length !== 3) {
    return res.status(400).json({ error: 'Parámetros inválidos. Se requiere countryCode, category y un array de 3 respuestas.' });
  }

  const countryData = COUNTRY_FACTS[countryCode];
  if (!countryData || !countryData[category]) {
    return res.status(404).json({ error: 'País o categoría no soportados' });
  }

  try {
    const quizQuestions = countryData[category].quiz;
    const results = [];
    let correctCount = 0;

    for (let i = 0; i < 3; i++) {
      const isCorrect = parseInt(answers[i]) === quizQuestions[i].answer;
      if (isCorrect) correctCount++;
      results.push({
        questionIdx: i,
        correct: isCorrect,
        correctOption: quizQuestions[i].answer
      });
    }

    // Si respondieron las 3 bien, subimos el nivel en la base de datos
    let newLevel = 0;
    let unlockedCard = false;

    if (correctCount === 3) {
      await db.query('BEGIN');

      // 1. Asegurar que el país está descubierto en el pasaporte
      await db.query(
        `INSERT INTO user_passports (country_code, country_name)
         VALUES ($1, $2)
         ON CONFLICT (country_code) DO NOTHING`,
        [countryCode, countryData.name]
      );

      // Determinar columna a actualizar
      let columnName = '';
      if (category === 'Comida') columnName = 'comida_nivel';
      else if (category === 'Naturaleza') columnName = 'naturaleza_nivel';
      else if (category === 'Economía') columnName = 'economia_nivel';
      else if (category === 'Costumbres') columnName = 'costumbres_nivel';
      else if (category === 'Geografía') columnName = 'geografia_nivel';

      // 2. Obtener nivel actual
      const currentRes = await db.query(`SELECT ${columnName} FROM user_passports WHERE country_code = $1`, [countryCode]);
      const currentLevel = currentRes.rows[0]?.[columnName] || 0;

      if (currentLevel < 3) {
        newLevel = currentLevel + 1;
        await db.query(`UPDATE user_passports SET ${columnName} = $1 WHERE country_code = $2`, [newLevel, countryCode]);
      } else {
        newLevel = 3; // ya al máximo
      }

      // 3. Crear una tarjeta de repetición espaciada si acaban de aprender esta sección por primera vez (nivel 1)
      if (currentLevel === 0) {
        // Seleccionamos la primera pregunta del quiz como la flashcard de repaso
        const flashcardQuestion = `[${category}] ${quizQuestions[0].question}`;
        const flashcardAnswer = quizQuestions[0].options[quizQuestions[0].answer];

        // Verificar si la tarjeta ya existe para no duplicar
        const cardCheck = await db.query(
          'SELECT id FROM learning_cards WHERE country_code = $1 AND question = $2',
          [countryCode, flashcardQuestion]
        );

        if (cardCheck.rowCount === 0) {
          await db.query(
            `INSERT INTO learning_cards (country_code, question, answer, repetition, interval, ease_factor, next_review)
             VALUES ($1, $2, $3, 0, 1, 2.50, CURRENT_TIMESTAMP)`,
            [countryCode, flashcardQuestion, flashcardAnswer]
          );
          unlockedCard = true;
        }
      }

      await db.query('COMMIT');
    }

    res.json({
      success: correctCount === 3,
      correctCount,
      results,
      newLevel,
      unlockedCard
    });

  } catch (err) {
    if (correctCount === 3) await db.query('ROLLBACK');
    console.error('Error al calificar quiz:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/learning/passport - Obtiene el estado del pasaporte y los niveles acumulados
router.get('/passport', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT country_code, country_name, first_visit, comida_nivel, naturaleza_nivel, economia_nivel, costumbres_nivel, geografia_nivel FROM user_passports ORDER BY first_visit DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/learning/discover - Descubre un país (usado por ruleta o click en globo por primera vez)
router.post('/discover', async (req, res) => {
  const { countryCode } = req.body;

  if (!countryCode || !COUNTRY_FACTS[countryCode]) {
    return res.status(400).json({ error: 'Código de país inválido o no soportado en la simulación' });
  }

  const countryData = COUNTRY_FACTS[countryCode];

  try {
    await db.query('BEGIN');

    // 1. Insertar el país en el pasaporte si no existe
    const passportRes = await db.query(
      `INSERT INTO user_passports (country_code, country_name)
       VALUES ($1, $2)
       ON CONFLICT (country_code) DO NOTHING
       RETURNING *`,
      [countryCode, countryData.name]
    );

    const isNewCountry = passportRes.rowCount > 0;

    await db.query('COMMIT');

    res.json({
      message: isNewCountry ? `País ${countryData.name} descubierto y registrado.` : `País ${countryData.name} ya estaba descubierto.`,
      countryName: countryData.name,
      countryCode,
      isNew: isNewCountry
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error al descubrir país:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/learning/cards - Obtiene las tarjetas pendientes de repaso para hoy
router.get('/cards', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.id, c.country_code, p.country_name, c.question, c.answer, c.repetition, c.interval, c.ease_factor, c.next_review
      FROM learning_cards c
      JOIN user_passports p ON c.country_code = p.country_code
      WHERE c.next_review <= CURRENT_TIMESTAMP
      ORDER BY c.next_review ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/learning/review - Procesa la respuesta de una tarjeta (algoritmo SM-2)
router.post('/review', async (req, res) => {
  const { cardId, grade } = req.body; // grade es un entero de 0 a 5

  if (cardId === undefined || grade === undefined || grade < 0 || grade > 5) {
    return res.status(400).json({ error: 'Parámetros inválidos. Se requiere cardId y un grade entre 0 y 5.' });
  }

  try {
    // 1. Obtener la tarjeta
    const cardRes = await db.query('SELECT id, country_code, question, repetition, interval, ease_factor FROM learning_cards WHERE id = $1', [cardId]);
    if (cardRes.rowCount === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    const card = cardRes.rows[0];
    let repetition = parseInt(card.repetition);
    let interval = parseInt(card.interval);
    let easeFactor = parseFloat(card.ease_factor);

    // 2. Aplicar algoritmo estricto SuperMemo-2 (SM-2)
    if (grade >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition += 1;
    } else {
      repetition = 0;
      interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    await db.query('BEGIN');

    // 3. Actualizar la tarjeta
    await db.query(
      `UPDATE learning_cards
       SET repetition = $1, interval = $2, ease_factor = $3, last_reviewed = CURRENT_TIMESTAMP, next_review = $4
       WHERE id = $5`,
      [repetition, interval, easeFactor, nextReview, cardId]
    );

    // 4. Si la respuesta fue recordada con excelencia (grade >= 5), aumentamos la barra de nivel de la sección
    if (grade >= 5) {
      const match = card.question.match(/^\[(Comida|Naturaleza|Economía|Costumbres|Geografía)\]/);
      if (match) {
        const category = match[1];
        let columnName = '';
        if (category === 'Comida') columnName = 'comida_nivel';
        else if (category === 'Naturaleza') columnName = 'naturaleza_nivel';
        else if (category === 'Economía') columnName = 'economia_nivel';
        else if (category === 'Costumbres') columnName = 'costumbres_nivel';
        else if (category === 'Geografía') columnName = 'geografia_nivel';

        if (columnName) {
          // Obtener nivel actual
          const currentRes = await db.query(`SELECT ${columnName} FROM user_passports WHERE country_code = $1`, [card.country_code]);
          const currentLevel = currentRes.rows[0]?.[columnName] || 0;
          if (currentLevel < 3) {
            await db.query(`UPDATE user_passports SET ${columnName} = ${columnName} + 1 WHERE country_code = $1`, [card.country_code]);
          }
        }
      }
    }

    await db.query('COMMIT');

    res.json({
      message: 'Repaso registrado con éxito.',
      newRepetition: repetition,
      newInterval: interval,
      newEaseFactor: easeFactor,
      nextReviewDate: nextReview
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error al procesar el repaso de la flashcard:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
