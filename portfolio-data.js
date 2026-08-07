const portfolioPages = {
  photography: {
    title: "Photography",
    description: "Explore automotive work and commissioned editorials created for RUSH Magazine.",
    cards: [
      { title: "Automotive Photography", description: "Five vehicle collections", href: "/photography/automotive-photography/", image: "/photography/automotive-photography/mazda-mx5-mk2/_DSC9988-Edit-2.jpg" },
      { title: "RUSH Magazine", description: "Editorial features", href: "/photography/rush-magazine/", image: "/photography/rush-magazine/alfa-romeo-gtv-cup/_DSC8488-Edit-3.JPG" }
    ]
  },
  "automotive-photography": {
    title: "Automotive Photography",
    parent: { label: "Photography", href: "/photography/" },
    description: "Vehicle photography with an emphasis on shape, detail and the road around it.",
    cards: [
      { title: "Honda NSX", description: "6 photographs", href: "/photography/automotive-photography/honda-nsx/", image: "/photography/automotive-photography/honda-nsx/_DSC8923-Edit-2.jpg" },
      { title: "Mazda Mx5 Mk1", description: "Gallery coming soon", href: "/photography/automotive-photography/mazda-mx5-mk1/" },
      { title: "Mazda Mx5 Mk2", description: "9 photographs", href: "/photography/automotive-photography/mazda-mx5-mk2/", image: "/photography/automotive-photography/mazda-mx5-mk2/_DSC9988-Edit-2.jpg" },
      { title: "Subaru Outback", description: "4 photographs", href: "/photography/automotive-photography/subaru-outback/", image: "/photography/automotive-photography/subaru-outback/_DSC1548.jpg" },
      { title: "Volkswagen New Beetle", description: "Gallery coming soon", href: "/photography/automotive-photography/vw-new-beetle/" },
      { title: "Toyota JZX90", description: "3 photographs", href: "/photography/automotive-photography/toyota-jzx90/", image: "/photography/automotive-photography/toyota-jzx90/_DSC8409-Edit-2.JPG" }
    ]
  },
  "rush-magazine": {
    title: "RUSH Magazine",
    parent: { label: "Photography", href: "/photography/" },
    description: "Editorial automotive photography created for RUSH Magazine.",
    cards: [
      { title: "Alfa Romeo GTV Cup", description: "12 photographs", href: "/photography/rush-magazine/alfa-romeo-gtv-cup/", image: "/photography/rush-magazine/alfa-romeo-gtv-cup/_DSC8488-Edit-3.JPG" },
      { title: "Eunos Roadster Mk1", description: "11 photographs", href: "/photography/rush-magazine/eunos-roadster-mk1/", image: "/photography/rush-magazine/eunos-roadster-mk1/_DSC3160-Edit.jpg" }
    ]
  },
  "honda-nsx": { title: "Honda NSX", parent: { label: "Automotive Photography", href: "/photography/automotive-photography/" }, images: ["_DSC8923-Edit-2.jpg", "_DSC8927-Edit-2.jpg", "_DSC8929-Edit-2.jpg", "_DSC8937-Edit-2.jpg", "_DSC8978-Edit-2.jpg", "_DSC9018-Edit.jpg"], folder: "/photography/automotive-photography/honda-nsx/" },
  "mazda-mx5-mk1": { title: "Mazda Mx5 Mk1", parent: { label: "Automotive Photography", href: "/photography/automotive-photography/" }, images: [], folder: "/photography/automotive-photography/mazda-mx5-mk1/" },
  "mazda-mx5-mk2": { title: "Mazda Mx5 Mk2", parent: { label: "Automotive Photography", href: "/photography/automotive-photography/" }, images: ["_DSC9893-Edit-Edit-2.jpg", "_DSC9900-Edit.jpg", "_DSC9918-Edit.jpg", "_DSC9930-Edit-Edit-2.jpg", "_DSC9931-Edit.jpg", "_DSC9943-Edit.jpg", "_DSC9944-Edit-2.jpg", "_DSC9964-Edit.jpg", "_DSC9988-Edit-2.jpg"], folder: "/photography/automotive-photography/mazda-mx5-mk2/" },
  "subaru-outback": { title: "Subaru Outback", parent: { label: "Automotive Photography", href: "/photography/automotive-photography/" }, images: ["_DSC1519.jpg", "_DSC1532.jpg", "_DSC1540.jpg", "_DSC1548.jpg"], folder: "/photography/automotive-photography/subaru-outback/" },
  "toyota-jzx90": { title: "Toyota JZX90", parent: { label: "Automotive Photography", href: "/photography/automotive-photography/" }, images: ["_DSC8399-Edit-2-2.JPG", "_DSC8403-Edit-2.JPG", "_DSC8409-Edit-2.JPG"], folder: "/photography/automotive-photography/toyota-jzx90/" },
  "alfa-romeo-gtv-cup": { title: "Alfa Romeo GTV Cup", parent: { label: "RUSH Magazine", href: "/photography/rush-magazine/" }, images: ["_DSC8094-Edit.JPG", "_DSC8098-Edit.JPG", "_DSC8112-Edit-2.JPG", "_DSC8116-Edit-2.JPG", "_DSC8121-Edit-2.JPG", "_DSC8196-Edit.JPG", "_DSC8203-Edit-3.JPG", "_DSC8241-Edit.JPG", "_DSC8244-Edit-2.JPG", "_DSC8247-Edit-2.JPG", "_DSC8467-Edit-4.JPG", "_DSC8488-Edit-3.JPG"], folder: "/photography/rush-magazine/alfa-romeo-gtv-cup/" },
  "eunos-roadster-mk1": { title: "Eunos Roadster Mk1", parent: { label: "RUSH Magazine", href: "/photography/rush-magazine/" }, images: ["_DSC2832-Edit.jpg", "_DSC2860-Edit.jpg", "_DSC2891-Edit.jpg", "_DSC2902-Edit.jpg", "_DSC2906-Edit.jpg", "_DSC2916.jpg", "_DSC2943-Edit-2.jpg", "_DSC3028.jpg", "_DSC3054-2.jpg", "_DSC3100.jpg", "_DSC3160-Edit.jpg"], folder: "/photography/rush-magazine/eunos-roadster-mk1/" }
};
