const portfolioPages = {
  photography: {
    path: "/photography/",
    title: "Photography Portfolio | Justy Media",
    heading: "Photography",
    description: "Explore automotive and editorial photography by Justy Media, an independent creative studio based in the Peak District.",
    intro: "Automotive photography remains at the heart of Justy Media, alongside commissioned editorial and commercial image-making. Explore the established vehicle collections and work created for RUSH Magazine.",
    type: "CollectionPage",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }],
    cards: [
      { title: "Automotive Photography", description: "Six vehicle collections shaped around form, detail and location.", href: "/photography/automotive-photography/", image: "/photography/automotive-photography/honda-nsx/_DSC8937-Edit-2.jpg", alt: "Red Honda NSX photographed in warm woodland light", width: 2828, height: 3535 },
      { title: "RUSH Magazine", description: "Editorial features covering the Alfa Romeo GTV Cup and Eunos Roadster Mk1.", href: "/photography/rush-magazine/", image: "/photography/rush-magazine/alfa-romeo-gtv-cup/_DSC8094-Edit.JPG", alt: "Front wing and teledial wheel of a red Alfa Romeo GTV Cup", width: 3582, height: 4477 }
    ]
  },
  "automotive-photography": {
    path: "/photography/automotive-photography/",
    title: "Automotive Photography Portfolio | Justy Media",
    heading: "Automotive Photography",
    description: "Explore automotive photography by Justy Media, featuring distinctive cars, road scenes, details and editorial vehicle shoots.",
    intro: "Distinctive cars photographed with attention to their shape, character and surroundings. Every collection below contains finished work available in the initial page, with larger images progressively enhanced when JavaScript is available.",
    type: "CollectionPage",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }, { label: "Automotive Photography", href: "/photography/automotive-photography/" }],
    cards: [
      { title: "Honda NSX", description: "Six photographs", href: "/photography/automotive-photography/honda-nsx/", galleryKey: "honda-nsx" },
      { title: "Mazda MX-5 Mk1", description: "Two photographs", href: "/photography/automotive-photography/mazda-mx5-mk1/", galleryKey: "mazda-mx5-mk1" },
      { title: "Mazda MX-5 Mk2", description: "Four photographs", href: "/photography/automotive-photography/mazda-mx5-mk2/", galleryKey: "mazda-mx5-mk2" },
      { title: "Subaru Outback", description: "Four photographs", href: "/photography/automotive-photography/subaru-outback/", galleryKey: "subaru-outback" },
      { title: "Volkswagen New Beetle", description: "Five photographs", href: "/photography/automotive-photography/vw-new-beetle/", galleryKey: "vw-new-beetle" },
      { title: "Toyota JZX90", description: "Three photographs", href: "/photography/automotive-photography/toyota-jzx90/", galleryKey: "toyota-jzx90" }
    ]
  },
  "rush-magazine": {
    path: "/photography/rush-magazine/",
    title: "RUSH Magazine Photography | Justy Media",
    heading: "RUSH Magazine",
    description: "Explore automotive editorial photography created by Justy Media for RUSH Magazine, including Alfa Romeo and Eunos Roadster features.",
    intro: "Automotive editorial photography created for RUSH Magazine, combining vehicle details, location portraits and road imagery into coherent visual features.",
    type: "CollectionPage",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }, { label: "RUSH Magazine", href: "/photography/rush-magazine/" }],
    cards: [
      { title: "Alfa Romeo GTV Cup", description: "Four photographs", href: "/photography/rush-magazine/alfa-romeo-gtv-cup/", galleryKey: "alfa-romeo-gtv-cup" },
      { title: "Eunos Roadster Mk1", description: "Four photographs", href: "/photography/rush-magazine/eunos-roadster-mk1/", galleryKey: "eunos-roadster-mk1" }
    ]
  },
  "honda-nsx": {
    path: "/photography/automotive-photography/honda-nsx/",
    title: "Honda NSX Automotive Photography | Justy Media",
    heading: "Honda NSX",
    description: "A red Honda NSX photographed by Justy Media, featuring details, woodland light and a selection of exterior views.",
    intro: "A study of a red Honda NSX in warm woodland light, moving between graphic details and wider views that show the car's low, purposeful shape.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }, { label: "Automotive Photography", href: "/photography/automotive-photography/" }, { label: "Honda NSX", href: "/photography/automotive-photography/honda-nsx/" }],
    folder: "/photography/automotive-photography/honda-nsx/",
    images: [
      ["_DSC8923-Edit-2.jpg", "Close view of the red Honda NSX bonnet and Honda badge", 2828, 3535],
      ["_DSC8927-Edit-2.jpg", "Red Recaro seat inside the Honda NSX", 2828, 3535],
      ["_DSC8929-Edit-2.jpg", "Rear view of the red Honda NSX beneath autumn trees", 2828, 3535],
      ["_DSC8937-Edit-2.jpg", "Low side view of the red Honda NSX in shafts of woodland light", 2828, 3535],
      ["_DSC8978-Edit-2.jpg", "Abstract reflection across the Honda NSX rear light", 2828, 3535],
      ["_DSC9018-Edit.jpg", "Red Honda NSX parked at an outdoor car gathering", 2828, 3535]
    ]
  },
  "mazda-mx5-mk1": {
    path: "/photography/automotive-photography/mazda-mx5-mk1/",
    title: "Mazda MX-5 Mk1 Photography | Justy Media",
    heading: "Mazda MX-5 Mk1",
    description: "A first-generation Mazda MX-5 photographed at sunset by Justy Media, including an exterior portrait and cabin detail.",
    intro: "A concise sunset collection pairing the silhouette of a first-generation Mazda MX-5 with an intimate view into its open cabin.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }, { label: "Automotive Photography", href: "/photography/automotive-photography/" }, { label: "Mazda MX-5 Mk1", href: "/photography/automotive-photography/mazda-mx5-mk1/" }],
    folder: "/photography/automotive-photography/mazda-mx5-mk1/",
    images: [
      ["_DSC6037-Edit-2.jpg", "Black Mazda MX-5 Mk1 photographed against an orange sunset", 3697, 4621],
      ["_DSC6059.jpg", "Steering wheel and cabin of a Mazda MX-5 Mk1 viewed through the open side", 3882, 4852]
    ]
  },
  "mazda-mx5-mk2": {
    path: "/photography/automotive-photography/mazda-mx5-mk2/",
    title: "Mazda MX-5 Mk2 Photography | Justy Media",
    heading: "Mazda MX-5 Mk2",
    description: "A silver Mazda MX-5 Mk2 photographed on Peak District roads, with exterior, detail and interior images by Justy Media.",
    intro: "A silver second-generation Mazda MX-5 set against narrow roads, green hills and purple heather, with restrained colour keeping the car at the centre of the collection.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }, { label: "Automotive Photography", href: "/photography/automotive-photography/" }, { label: "Mazda MX-5 Mk2", href: "/photography/automotive-photography/mazda-mx5-mk2/" }],
    folder: "/photography/automotive-photography/mazda-mx5-mk2/",
    images: [
      ["_DSC9893-Edit-Edit-2.jpg", "Close side detail of a silver Mazda MX-5 Mk2 front wheel", 2828, 3535],
      ["_DSC9918-Edit.jpg", "Silver Mazda MX-5 Mk2 facing along a narrow Peak District road", 2828, 3535],
      ["_DSC9930-Edit-Edit-2.jpg", "Silver Mazda MX-5 Mk2 beside green hills and purple heather", 2828, 3535],
      ["_DSC9943-Edit.jpg", "Side view of a silver Mazda MX-5 Mk2 framed by a dark foreground", 2828, 3535]
    ]
  },
  "subaru-outback": {
    path: "/photography/automotive-photography/subaru-outback/",
    title: "Subaru Outback Photography | Justy Media",
    heading: "Subaru Outback",
    description: "A Subaru Outback photographed by Justy Media on a wet moorland track, with wide exterior and close detail views.",
    intro: "A silver Subaru Outback placed in open moorland, using wet tracks, muted skies and rust-coloured grass to reflect the car's all-road character.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }, { label: "Automotive Photography", href: "/photography/automotive-photography/" }, { label: "Subaru Outback", href: "/photography/automotive-photography/subaru-outback/" }],
    folder: "/photography/automotive-photography/subaru-outback/",
    images: [
      ["_DSC1519.jpg", "Silver Subaru Outback beside a wet moorland track", 2560, 3200],
      ["_DSC1532.jpg", "Rear three-quarter view of a silver Subaru Outback in moorland grass", 2560, 3200],
      ["_DSC1540.jpg", "Subaru Outback viewed from behind across a rain-darkened track", 2560, 3200],
      ["_DSC1548.jpg", "Close front-quarter detail of a silver Subaru Outback on the moors", 2560, 3200]
    ]
  },
  "toyota-jzx90": {
    path: "/photography/automotive-photography/toyota-jzx90/",
    title: "Toyota JZX90 Photography | Justy Media",
    heading: "Toyota JZX90",
    description: "A white Toyota JZX90 photographed from low angles by Justy Media, highlighting its stance, wheels and body shape.",
    intro: "Three low-angle portraits of a white Toyota JZX90, using open sky and spare surroundings to emphasise stance and detail.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }, { label: "Automotive Photography", href: "/photography/automotive-photography/" }, { label: "Toyota JZX90", href: "/photography/automotive-photography/toyota-jzx90/" }],
    folder: "/photography/automotive-photography/toyota-jzx90/",
    images: [
      ["_DSC8399-Edit-2-2.JPG", "Low rear three-quarter view of a white Toyota JZX90", 3520, 4400],
      ["_DSC8403-Edit-2.JPG", "Close low-angle view of the Toyota JZX90 front wheel and wing", 3574, 4468],
      ["_DSC8409-Edit-2.JPG", "Low side detail of a white Toyota JZX90 against a blue sky", 3494, 4368]
    ]
  },
  "vw-new-beetle": {
    path: "/photography/automotive-photography/vw-new-beetle/",
    title: "Volkswagen New Beetle Photography | Justy Media",
    heading: "Volkswagen New Beetle",
    description: "A blue Volkswagen New Beetle photographed after dark by Justy Media, with atmospheric exterior and detail images.",
    intro: "An atmospheric night-time study of a blue Volkswagen New Beetle, balancing cool bodywork with warm street and indicator light.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }, { label: "Automotive Photography", href: "/photography/automotive-photography/" }, { label: "Volkswagen New Beetle", href: "/photography/automotive-photography/vw-new-beetle/" }],
    folder: "/photography/automotive-photography/vw-new-beetle/",
    images: [
      ["_DSC2011-Edit.jpg", "Blue Volkswagen New Beetle centred on a quiet road after dark", 2560, 3200],
      ["_DSC2020-Edit-2.jpg", "Close front-quarter detail of a blue Volkswagen New Beetle", 2560, 3200],
      ["_DSC2046.jpg", "Volkswagen New Beetle rear indicator glowing orange at night", 2560, 3200],
      ["_DSC2058-Edit-3.jpg", "Blue Volkswagen New Beetle beneath trees and street lights", 2560, 3200],
      ["_DSC2072.jpg", "THULE roof-rack detail on a Volkswagen New Beetle", 2560, 3200]
    ]
  },
  "alfa-romeo-gtv-cup": {
    path: "/photography/rush-magazine/alfa-romeo-gtv-cup/",
    title: "Alfa Romeo GTV Cup Photography | Justy Media",
    heading: "Alfa Romeo GTV Cup",
    description: "An Alfa Romeo GTV Cup editorial photographed by Justy Media for RUSH Magazine, including road, detail and engine images.",
    intro: "An editorial feature for RUSH Magazine following a red Alfa Romeo GTV Cup from tactile cabin and mechanical details to wide Peak District road scenes.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }, { label: "RUSH Magazine", href: "/photography/rush-magazine/" }, { label: "Alfa Romeo GTV Cup", href: "/photography/rush-magazine/alfa-romeo-gtv-cup/" }],
    folder: "/photography/rush-magazine/alfa-romeo-gtv-cup/",
    images: [
      ["_DSC8094-Edit.JPG", "Front wing and teledial wheel of a red Alfa Romeo GTV Cup", 3582, 4477],
      ["_DSC8098-Edit.JPG", "Driver's view into the Alfa Romeo GTV Cup cabin", 4000, 5000],
      ["_DSC8112-Edit-2.JPG", "Alfa Romeo badge on the red GTV Cup bodywork", 3706, 4632],
      ["_DSC8116-Edit-2.JPG", "Red Alfa Romeo brake calliper framed by a silver wheel", 3978, 4972]
    ]
  },
  "eunos-roadster-mk1": {
    path: "/photography/rush-magazine/eunos-roadster-mk1/",
    title: "Eunos Roadster Mk1 Photography | Justy Media",
    heading: "Eunos Roadster Mk1",
    description: "A red Eunos Roadster Mk1 editorial photographed by Justy Media for RUSH Magazine on open Peak District roads at sunset.",
    intro: "A RUSH Magazine road story with a red Eunos Roadster Mk1, photographed across open tarmac and dramatic sunset skies with detail views of its cabin and engine.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Photography", href: "/photography/" }, { label: "RUSH Magazine", href: "/photography/rush-magazine/" }, { label: "Eunos Roadster Mk1", href: "/photography/rush-magazine/eunos-roadster-mk1/" }],
    folder: "/photography/rush-magazine/eunos-roadster-mk1/",
    images: [
      ["_DSC2832-Edit.jpg", "Red Eunos Roadster Mk1 driving towards the camera at sunset", 4000, 5176],
      ["_DSC2860-Edit.jpg", "Elevated view of a red Eunos Roadster on an open moorland road", 3815, 4769],
      ["_DSC2891-Edit.jpg", "Red Eunos Roadster beneath a dramatic orange evening sky", 3200, 4000],
      ["_DSC2902-Edit.jpg", "Low head-on portrait of a red Eunos Roadster at sunset", 3802, 4753]
    ]
  }
};

if (typeof module !== "undefined") module.exports = portfolioPages;
